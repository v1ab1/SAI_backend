import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifiedFileEntity, FileType } from './entities/modifiedFiles.entity';
import { Repository } from 'typeorm';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';

@Injectable()
export class ModifiedFilesService {
  constructor(
    @InjectRepository(ModifiedFileEntity)
    private readonly repository: Repository<ModifiedFileEntity>,
  ) {}

  findAll(userId: number, fileType: FileType) {
    const qb = this.repository.createQueryBuilder('modifiedFile');

    qb.where('modifiedFile.userId = :userId', { userId });

    if (fileType === FileType.PHOTOS) {
      qb.andWhere('modifiedFile.mimetype ILIKE :type', { type: '%image%' });
    }

    if (fileType === FileType.TRASH) {
      qb.withDeleted().andWhere('modifiedFile.deletedAt IS NOT NULL');
    }

    return qb.getMany();
  }

  getFile(filename: string) {
    const filePath = join(process.cwd(), 'uploads', filename); // Обновите путь в соответствии с вашей структурой проекта

    // Проверяем, существует ли файл
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }

  create(file: Express.Multer.File, userId: number) {
    return this.repository.save({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      user: { id: userId },
    });
  }

  save(newName: string, ext: string, userId: number) {
    console.log(userId);
    return this.repository.save({
      filename: newName,
      originalName: newName,
      size: 0,
      mimetype:
        ext === '.xlsx' || ext === '.xsl'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
      user: { id: userId },
    });
  }

  async remove(userId: number, ids: string) {
    const idsArray = [ids];

    const qb = this.repository.createQueryBuilder('file');

    qb.where('id IN (:...ids) AND userId = :userId', {
      ids: idsArray,
      userId,
    });

    return qb.softDelete().execute();
  }
}
