import { Table, Column, Model, DataType, HasOne, HasMany } from 'sequelize-typescript';
import { UserToken } from './user-token.model';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {
  is_active?: boolean;
}

@Table({ tableName: 'users' })
export class Users extends Model<UserAttributes, UserCreationAttributes> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_active: boolean;

}
