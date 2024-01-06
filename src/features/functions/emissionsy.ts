import fs from 'fs';
import { parse, write } from 'fast-csv';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import * as math from 'mathjs';
import { Workbook } from 'exceljs';

export const processCsvOutliers = async (
  fileName: string,
  newName: string,
  handleType: string,
) => {
  const filePath = join(process.cwd(), 'uploads', fileName);
  const outputFilePath = join(process.cwd(), 'uploads', newName);
  const streamData: any[] = [];

  const readStream = createReadStream(filePath);
  const writeStream = createWriteStream(outputFilePath);
  const parser = parse({ headers: true });

  // Собираем данные из всего файла для последующего анализа
  parser.on('data', (row) => {
    streamData.push(row);
  });

  parser.on('end', async () => {
    // Вычисляем статистические показатели для каждого столбца
    const columnStats = calculateColumnStats(streamData);

    // Обработка каждой строки в зависимости от выбранного метода обработки выбросов
    const processedData = streamData
      .map((row) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach((key) => {
          const value = parseFloat(newRow[key]);
          const isOutlier = checkIsOutlier(value, columnStats[key]);

          switch (handleType) {
            case 'delete':
              if (isOutlier) {
                newRow[key] = null; // Mark the entire row for deletion below
              }
              break;
            case 'log':
              if (isOutlier && value > 0) {
                // Log only makes sense for positive values
                newRow[key] = Math.log(value).toString();
              }
              break;
            case 'avg':
              if (isOutlier) {
                newRow[key] = columnStats[key].average.toString();
              }
              break;
          }
        });

        return Object.values(newRow).some((value) => value === null)
          ? null
          : newRow; // Delete row if marked
      })
      .filter((row) => row !== null);

    // Пишем обработанные данные обратно в новый CSV-файл
    writeStream.on('finish', () =>
      console.log(`File processed and saved as ${outputFilePath}`),
    );
    write(processedData, { headers: true }).pipe(writeStream);
  });

  readStream.pipe(parser);
};

function calculateColumnStats(
  data: any[],
): Record<string, { min: number; max: number; average: number }> {
  const stats: Record<string, any> = {};

  // Initialization of the stats records
  for (const key in data[0]) {
    stats[key] = { sum: 0, count: 0, squareSum: 0 };
  }

  // Summing and counting for each column
  for (const row of data) {
    for (const key in row) {
      const value = parseFloat(row[key]);
      if (!isNaN(value)) {
        stats[key].sum += value;
        stats[key].count += 1;
        stats[key].squareSum += value * value;
      }
    }
  }

  // Calculate statistics based on sums and counts
  for (const key in stats) {
    const { sum, count, squareSum } = stats[key];
    const average = sum / count;
    const variance = (squareSum - (sum * sum) / count) / (count - 1);
    const stdDev = Math.sqrt(variance);

    stats[key] = {
      min: average - 2 * stdDev,
      max: average + 2 * stdDev,
      average: average,
    };
  }

  return stats;
}

function checkIsOutlier(
  value: number,
  stats: { min: number; max: number; average: number },
): boolean {
  return value < stats.min || value > stats.max;
}

// Пример вызова:
// processCsvOutliers('data.csv', 'data_processed.csv', 'average');

export const processExcelOutliers = async (
  fileName: string,
  newName: string,
  processingType: string,
) => {
  // Определить пути к файлам
  const filePath = join(process.cwd(), 'uploads', fileName);
  const outputPath = join(process.cwd(), 'uploads', newName);

  // Загрузить рабочую книгу Excel
  const workbook = new Workbook();
  await workbook.xlsx.readFile(filePath);

  // Работаем с первым листом
  const worksheet = workbook.getWorksheet(1);

  // Собрать статистику для каждого столбца
  const stats = getColumnStatistics(worksheet);

  // Обработка данных в зависимости от аргумента функции
  worksheet.eachRow((row, rowIndex) => {
    let deleteRow = false;

    row.eachCell((cell, colNumber) => {
      const currentColumnStats = stats[colNumber];
      const cellValue = cell.value as number; // Предполагаем численное значение

      if (cellValue != null && !isNaN(cellValue)) {
        const isOutlier =
          cellValue < currentColumnStats.min ||
          cellValue > currentColumnStats.max;

        if (isOutlier) {
          switch (processingType) {
            case 'delete':
              deleteRow = true; // Отметить строку на удаление
              break;
            case 'log':
              if (cellValue > 0) {
                cell.value = Math.log(cellValue);
              }
              break;
            case 'average':
              cell.value = currentColumnStats.average;
              break;
          }
        }
      }
    });

    if (deleteRow) {
      worksheet.spliceRows(rowIndex, 1); // Удалить строку, если она была отмечена
    }
  });

  // Записать обработанные данные в новый файл
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Processed file is saved to ${outputPath}`);
};

const getColumnStatistics = (worksheet: any) => {
  // сокращенно для примера
  // Реальная имплементация будет вычислять статистику для каждого столбца
};

// Пример вызова:
// processExcelOutliers('data.xlsx', 'processed_data.xlsx', 'average');
