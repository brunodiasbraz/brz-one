// src/user/model/user-token.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Users } from './users.model';

interface UserTokenAttributes {
  id: number;
  user_id: number;
  token_hash: string;
  type: string; // 'activation'
  expires_at: Date;
  used_at: Date | null;
}

interface UserTokenCreationAttributes
  extends Omit<UserTokenAttributes, 'id' | 'used_at'> {}


@Table({ tableName: 'user_tokens' })
export class UserToken extends Model<
  UserTokenAttributes,
  UserTokenCreationAttributes
> {
  @ForeignKey(() => Users)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @BelongsTo(() => Users)
  user: Users;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  token_hash: string;

  // "activation" por enquanto, mas você pode reutilizar p/ reset de senha etc.
  @Column({ type: DataType.STRING, allowNull: false })
  type: string; // 'activation'

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  used_at: Date | null;
}
