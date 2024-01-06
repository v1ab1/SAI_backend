import { Workbook } from 'exceljs';
import { join } from 'path';
import { parse, write } from 'fast-csv';
import { createReadStream, createWriteStream } from 'fs';

export const processExcelFile = async (
  fileName: string,
  newName: string,
  fillType: string,
) => {
  const filePath = join(process.cwd(), 'uploads', fileName);
  const workbook = new Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1); // Работаем с первым листом

  const columnValues: number[] = worksheet.getColumn(1).values as number[];
  const numericValues = columnValues.filter(
    (value) => typeof value === 'number' && !isNaN(value),
  );

  let replacementValue: number | undefined;

  switch (fillType) {
    case 'min':
      replacementValue = Math.min(...numericValues);
      break;
    case 'max':
      replacementValue = Math.max(...numericValues);
      break;
    case 'avg':
      const total = numericValues.reduce((sum, value) => sum + value, 0);
      replacementValue = total / numericValues.length;
      break;
  }

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (fillType === 'delete' && cell.value === null) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        worksheet.getColumn(colNumber).splice(cell.row, 1); // Удаляем целиком строку
        return;
      }
      if (cell.value === null && replacementValue !== undefined) {
        cell.value = replacementValue; // Заменяем пустые ячейки
      }
    });
  });

  const outputFilePath = join(process.cwd(), 'uploads', newName);
  await workbook.xlsx.writeFile(outputFilePath);
  console.log(`File processed and saved as ${outputFilePath}`);
};

export const processCsvFile = async (
  fileName: string,
  newName: string,
  fillType: string,
) => {
  const filePath = join(process.cwd(), 'uploads', fileName);
  const outputFilePath = join(process.cwd(), 'uploads', newName);
  const numericValues: number[] = [];

  const readStream = createReadStream(filePath);
  const writeStream = createWriteStream(outputFilePath);
  const parser = parse({ headers: true });

  parser.on('data', (row) => {
    // Преобразуем и обрабатываем значения
    Object.keys(row).forEach((key) => {
      if (!isNaN(+row[key])) {
        numericValues.push(+row[key]);
      }
    });
  });

  parser.on('end', () => {
    let replacementValue: number | undefined;
    switch (fillType) {
      case 'min':
        replacementValue = Math.min(...numericValues);
        break;
      case 'max':
        replacementValue = Math.max(...numericValues);
        break;
      case 'avg':
        const total = numericValues.reduce((sum, value) => sum + value, 0);
        replacementValue =
          numericValues.length > 0 ? total / numericValues.length : 0;
        break;
    }

    // Обработка файла для вставки или удаления значений
    const processedRows: any[] = [];
    readStream
      .pipe(parse({ headers: true }))
      .on('data', (row) => {
        let isEmptyRow = false;
        const newRow = { ...row };

        Object.keys(newRow).forEach((key) => {
          if (fillType === 'delete' && newRow[key] === '') {
            isEmptyRow = true; // Если удаляем строки, проверяем, есть ли пустые ячейки
          } else if (newRow[key] === '' && replacementValue !== undefined) {
            newRow[key] = replacementValue; // Заполняем пустые ячейки
          }
        });

        if (!isEmptyRow) {
          processedRows.push(newRow);
        }
      })
      .on('end', () => {
        // После обработки всех строк записываем результат в новый файл
        writeStream.on('finish', () =>
          console.log(`File processed and saved as ${outputFilePath}`),
        );
        write(processedRows, { headers: true }).pipe(writeStream);
      });
  });

  readStream.pipe(parser);
};
