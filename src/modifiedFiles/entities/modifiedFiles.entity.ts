import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum FileType {
  PHOTOS = 'photos',
  TRASH = 'trash',
}

@Entity('modifiedFiles')
export class ModifiedFileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @ManyToOne(() => UserEntity, (user) => user.modifiedFiles)
  user: UserEntity;

  @DeleteDateColumn()
  deletedAt?: Date;
}
