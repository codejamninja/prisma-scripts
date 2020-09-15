import dotenv from 'dotenv';
import ora from 'ora';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const { argv } = process;
dotenv.config({ path: path.resolve(process.cwd(), argv[2] || '.', '.env') });
const prisma = new PrismaClient();

export default async function seed(entities: Entities, spinner = ora()) {
  const result = await Promise.all<Result>(
    Object.entries(entities).map(
      async ([key, entity]: [string, Entity | Entity[]]) => {
        spinner.start(`seeding '${key}'`);
        if (!prisma[key]) {
          spinner.warn(`failed to find '${key}'`);
          return [key, null];
        }
        if (!Array.isArray(entity)) entity = [entity];
        if (await prisma[key].count()) {
          spinner.info(`already seeded '${key}'`);
          return [key, null];
        }
        const result = await Promise.all(
          entity.map(async (entity: Entity) => {
            return prisma[key].create(entity);
          })
        );
        console.log(result);
        spinner.succeed(`seeded '${key}'`);
        return [key, result];
      }
    )
  );
  await prisma.$disconnect();
  return result.reduce((mappedResult: MappedResult, [key, value]: Result) => {
    mappedResult[key] = value;
    return mappedResult;
  }, {});
}

export type Result = [string, any[] | null];

export interface MappedResult {
  [key: string]: any[] | null;
}

export interface Entities {
  [key: string]: Entity | Entity[];
}

export interface Entity {
  [key: string]: any;
}
