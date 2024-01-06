import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity';
import { ModifiedFileEntity } from 'src/modifiedFiles/entities/modifiedFiles.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => FileEntity, (file) => file.user)
  files: FileEntity[];

  @OneToMany(() => ModifiedFileEntity, (modifiedFiles) => modifiedFiles.user)
  modifiedFiles: ModifiedFileEntity[];
}
