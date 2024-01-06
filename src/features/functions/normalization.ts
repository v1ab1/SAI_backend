import { Workbook, Worksheet } from 'exceljs';
import { join } from 'path';

export const normalizeExcelData = async (
  fileName: string,
  newName: string,
  normalizationType: string,
) => {
  const filePath = join(process.cwd(), 'uploads', fileName);
  const outputPath = join(process.cwd(), 'uploads', newName);
  const rangeMin = 0;
  const rangeMax = 1;

  const workbook = new Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  // Собрать статистику для каждого столбца
  const columnStats = calculateColumnStats(worksheet);

  // Нормализовать значения
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const value = cell.value;

      if (typeof value === 'number' && !isNaN(value)) {
        const columnStat = columnStats[colNumber];
        switch (normalizationType) {
          case 'range':
            if (rangeMin !== undefined && rangeMax !== undefined) {
              // Привести к указанному диапазону
              cell.value =
                ((value - columnStat.min) / (columnStat.max - columnStat.min)) *
                  (rangeMax - rangeMin) +
                rangeMin;
            }
            break;
          case 'normal':
            // Привести к нормальному виду (z-оценка)
            cell.value = (value - columnStat.mean) / columnStat.std;
            break;
        }
      }
    });
  });

  await workbook.xlsx.writeFile(outputPath);
  console.log(`Normalized file is saved to ${outputPath}`);
};

interface ColumnStats {
  min: number;
  max: number;
  mean: number;
  std: number;
  count: number;
}

const calculateColumnStats = (
  worksheet: Worksheet,
): Record<number, ColumnStats> => {
  const stats: Record<number, ColumnStats> = {};

  // Инициализация статистики для каждого столбца
  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const value = Number(cell.value);
      if (!isNaN(value)) {
        if (!stats[colNumber]) {
          stats[colNumber] = {
            min: value,
            max: value,
            mean: 0,
            std: 0,
            count: 0,
          };
        } else {
          stats[colNumber].min = Math.min(stats[colNumber].min, value);
          stats[colNumber].max = Math.max(stats[colNumber].max, value);
        }

        // Обновление среднего значения и количества наблюдений для подсчета STD позже
        const currentStat = stats[colNumber];
        currentStat.mean =
          (currentStat.mean * currentStat.count + value) /
          (currentStat.count + 1);
        currentStat.count += 1;
      }
    });
  });

  // Вычисление стандартного отклонения для каждого столбца
  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const value = Number(cell.value);

      if (!isNaN(value) && stats[colNumber] && stats[colNumber].count > 1) {
        const currentStat = stats[colNumber];
        currentStat.std += (value - currentStat.mean) ** 2;
      }
    });
  });

  // Финализация стандартного отклонения
  Object.keys(stats).forEach((key) => {
    const currentStat = stats[Number(key)];
    currentStat.std = Math.sqrt(currentStat.std / (currentStat.count - 1));
  });

  return stats;
};

// Пример вызова:
// normalizeExcelData('data.xlsx', 'normalized_data.xlsx', 'range', 0, 1); // для диапазона с мин=0 и макс=1
// или
// normalizeExcelData('data.xlsx', 'normalized_data.xlsx', 'normal'); // для стандартного нормального распределения

import fs from 'fs';
import { parse, write, writeToPath } from 'fast-csv';

export const normalizeCsvData = async (
  inputFileName: string,
  outputFileName: string,
  normalizationType: string,
) => {
  const rangeMin = 0;
  const rangeMax = 1;
  const inputFilePath = join(process.cwd(), 'uploads', inputFileName);
  const outputFilePath = join(process.cwd(), 'uploads', outputFileName);
  const rows: Array<any> = [];
  const stats: Record<
    string,
    {
      sum: number;
      sqSum: number;
      count: number;
      min?: number;
      max?: number;
      mean?: number;
      std?: number;
    }
  > = {};

  // Считываем данные и рассчитываем статистику
  fs.createReadStream(inputFilePath)
    .pipe(parse({ headers: true }))
    .on('data', (row) => {
      Object.keys(row).forEach((key) => {
        const value = parseFloat(row[key]);
        if (!isNaN(value)) {
          rows.push(row);
          stats[key] = stats[key] || { sum: 0, sqSum: 0, count: 0 };
          stats[key].sum += value;
          stats[key].sqSum += value ** 2;
          stats[key].count += 1;
          stats[key].min =
            stats[key].min !== undefined
              ? Math.min(stats[key].min, value)
              : value;
          stats[key].max =
            stats[key].max !== undefined
              ? Math.max(stats[key].max, value)
              : value;
        }
      });
    })
    .on('end', () => {
      // Вычисляем среднее и стандартное отклонение
      Object.keys(stats).forEach((key) => {
        const { sum, sqSum, count, min, max } = stats[key];
        const mean = sum / count;
        const variance = (sqSum - sum ** 2 / count) / (count - 1);
        const std = Math.sqrt(variance);
        stats[key] = { sum, sqSum, count, min, max, mean, std };
      });

      // Нормализуем данные
      const normalizedRows = rows.map((row) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach((key) => {
          const value = parseFloat(newRow[key]);
          if (
            normalizationType === 'range' &&
            rangeMin !== undefined &&
            rangeMax !== undefined
          ) {
            newRow[key] =
              ((value - stats[key].min) / (stats[key].max - stats[key].min)) *
                (rangeMax - rangeMin) +
              rangeMin;
          } else if (normalizationType === 'normal' && stats[key].std !== 0) {
            newRow[key] = (value - stats[key].mean) / stats[key].std;
          }
        });
        return newRow;
      });

      // Записываем нормализованные данные в новый CSV файл
      writeToPath(outputFilePath, normalizedRows, { headers: true }).on(
        'finish',
        () =>
          console.log(`Normalized data has been saved to ${outputFileName}`),
      );
    });
};

// Пример использования функции:
// normalizeCsvData('data.csv', 'normalized_data.csv', 'range', 0, 1);
// или
// normalizeCsvData('data.csv', 'normalized_data.csv', 'normal');
