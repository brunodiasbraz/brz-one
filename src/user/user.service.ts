import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Users } from './model/users.model';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { UserToken } from './model/user-token.model';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users) private userModel: typeof Users,
    @InjectModel(UserToken) private tokenModel: typeof UserToken,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(createUserDto: CreateUserDto): Promise<Users> {
    try {
      const passwrodHash = await bcrypt.hash(createUserDto.password, 10);
      const user = await Users.create({
        ...createUserDto,
        password: passwrodHash,
        is_active: false,
      });

      const jti = uuid();
      const token = this.jwtService.sign({
        sub: user.id,
        typ: 'activation',
        jti,
      });
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      const expires_at = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.tokenModel.create({
        user_id: user.id,
        token_hash: this.hashToken(token),
        type: 'activation',
        expires_at,
      });

      await this.sendActivationEmail(user.email, token);

      return {
        message:
          'Cadastro realizado com sucesso. Por favor, verifique seu e-mail para ativar a conta.',
      } as any;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new BadRequestException(error.original.detail);
      }
      throw error; // repassa outros erros
    }
  }

  private async sendActivationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    const link = `${this.configService.get<string>('APP_URL') || 'http://localhost:3000'}/user/activate?token=${token}`;

    await transporter.sendMail({
      from:
        this.configService.get<string>('MAIL_FROM') ||
        '"Suporte" <suporte@dominio.com>',
      to: email,
      subject: 'Ative sua conta Brz One',
      html: `
        <p>Bem-vindo a Brz One! Clique no botão abaixo para ativar sua conta:</p>
        <p><a href="${link}">Ativar minha conta</a></p>
        <p>Se você não solicitou, ignore este e-mail.</p>
      `,
      text: `Ative sua conta: ${link}`,
    });
  }

  async activateUser(token: string) {
    // 1) Verifica assinatura/expiração do JWT
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Token inválido ou expirado.');
    }
    if (payload.typ !== 'activation') {
      throw new BadRequestException('Tipo de token inválido.');
    }

    // 2) Checa se token existe e não foi usado
    const token_hash = this.hashToken(token);
    const record = await this.tokenModel.findOne({
      where: {
        user_id: payload.sub,
        token_hash,
        type: 'activation',
        used_at: null,
      },
    });
    if (!record) {
      throw new BadRequestException('Token já utilizado ou inválido.');
    }
    if (record.expires_at < new Date()) {
      throw new BadRequestException('Token expirado.');
    }

    // 3) Ativa usuário e invalida token
    const user = await this.userModel.findByPk(payload.sub);
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    if (user.is_active) {
      // evita reuso, mas deixa idempotente
      record.used_at = new Date();
      await record.save();
      return { message: 'Conta já estava ativa.' };
    }

    user.is_active = true;
    await user.save();

    record.used_at = new Date();
    await record.save();

    // (opcional) invalidar outros tokens de ativação ainda abertos
    await this.tokenModel.update(
      { used_at: new Date() },
      { where: { user_id: user.id, type: 'activation', used_at: null } },
    );

    return { message: 'Conta ativada com sucesso!' };
  }

  // (opcional) reenvio de ativação
  async resendActivation(email: string) {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    if (user.is_active) return { message: 'Conta já está ativa.' };
    // você pode reaproveitar createUser token-logic aqui (sem recriar o usuário)
    const jti = uuid();
    const token = this.jwtService.sign({
      sub: user.id,
      typ: 'activation',
      jti,
    });
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    const expires_at = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.tokenModel.create({
      user_id: user.id,
      token_hash: this.hashToken(token),
      type: 'activation',
      expires_at,
    });

    await this.sendActivationEmail(user.email, token);
    return { message: 'E-mail de ativação reenviado.' };
  }

  async findAll(): Promise<Users[]> {
    return this.userModel.findAll({
      attributes: { exclude: ['password'] }, // remove a coluna da resposta
    });
  }

  async findOne(id: number): Promise<Users> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<[number, Users[]]> {
    return this.userModel.update(updateUserDto, {
      where: { id },
      returning: true,
    });
  }
}
