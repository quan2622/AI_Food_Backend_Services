import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../../prisma/prisma.service';

const FOOD_INDEX = 'foods';
const INGREDIENT_INDEX = 'ingredients';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private esAvailable = true;
  private warnedUnavailable = false;

  constructor(
    private readonly es: ElasticsearchService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async onModuleInit() {
    try {
      await this.ensureIndices();
      this.esAvailable = true;
      this.warnedUnavailable = false;
    } catch (error) {
      this.markUnavailable(error, 'init indices');
    }
  }

  private markUnavailable(error: unknown, action: string) {
    this.esAvailable = false;
    if (!this.warnedUnavailable) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Elasticsearch unavailable while ${action}. Search indexing is disabled temporarily. Error: ${msg}`,
      );
      this.warnedUnavailable = true;
    }
  }

  private markAvailable() {
    if (!this.esAvailable) {
      this.logger.log('Elasticsearch connection restored');
    }
    this.esAvailable = true;
    this.warnedUnavailable = false;
  }

  // ─── Index Setup ────────────────────────────────────────────────────────────

  private async ensureIndices() {
    await this.ensureFoodIndex();
    await this.ensureIngredientIndex();
  }

  private async ensureFoodIndex() {
    const exists = await this.es.indices.exists({ index: FOOD_INDEX });
    if (!exists) {
      await this.es.indices.create({
        index: FOOD_INDEX,
        settings: {
          analysis: {
            filter: {
              ascii_fold: { type: 'asciifolding', preserve_original: true },
            },
            analyzer: {
              vi_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'ascii_fold'],
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'integer' },
            foodName: {
              type: 'text',
              analyzer: 'vi_analyzer',
              fields: { keyword: { type: 'keyword' } },
            },
            description: { type: 'text', analyzer: 'vi_analyzer' },
            imageUrl: { type: 'keyword', index: false },
            categoryId: { type: 'integer' },
            categoryName: {
              type: 'text',
              analyzer: 'vi_analyzer',
              fields: { keyword: { type: 'keyword' } },
            },
            calories: { type: 'float' },
            protein: { type: 'float' },
            carbs: { type: 'float' },
            fat: { type: 'float' },
            fiber: { type: 'float' },
          },
        },
      });
      this.logger.log(`Index "${FOOD_INDEX}" created`);
    }
  }

  private async ensureIngredientIndex() {
    const exists = await this.es.indices.exists({ index: INGREDIENT_INDEX });
    if (!exists) {
      await this.es.indices.create({
        index: INGREDIENT_INDEX,
        settings: {
          analysis: {
            filter: {
              ascii_fold: { type: 'asciifolding', preserve_original: true },
            },
            analyzer: {
              vi_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'ascii_fold'],
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'integer' },
            ingredientName: {
              type: 'text',
              analyzer: 'vi_analyzer',
              fields: { keyword: { type: 'keyword' } },
            },
            description: { type: 'text', analyzer: 'vi_analyzer' },
            imageUrl: { type: 'keyword', index: false },
            allergenNames: { type: 'keyword' },
          },
        },
      });
      this.logger.log(`Index "${INGREDIENT_INDEX}" created`);
    }
  }

  // ─── Index / Sync ───────────────────────────────────────────────────────────

  async indexFood(foodId: number) {
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
      include: {
        foodCategory: { select: { name: true } },
        nutritionProfile: {
          include: {
            values: { include: { nutrient: { select: { name: true } } } },
          },
        },
      },
    });
    if (!food) return;

    const getNutrient = (name: string) =>
      food.nutritionProfile?.values.find((v) => v.nutrient.name === name)?.value ?? null;

    if (!this.esAvailable) return;

    try {
      await this.es.index({
        index: FOOD_INDEX,
        id: String(food.id),
        document: {
          id: food.id,
          foodName: food.foodName,
          description: food.description,
          imageUrl: food.imageUrl,
          categoryId: food.categoryId,
          categoryName: food.foodCategory?.name ?? null,
          calories: getNutrient('Calories'),
          protein: getNutrient('Protein'),
          carbs: getNutrient('Carbohydrates'),
          fat: getNutrient('Fat'),
          fiber: getNutrient('Fiber'),
        },
      });
      this.markAvailable();
    } catch (error) {
      this.markUnavailable(error, 'indexing food');
    }
  }

  async indexIngredient(ingredientId: number) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: {
        ingredientAllergens: { include: { allergen: { select: { name: true } } } },
      },
    });
    if (!ingredient) return;

    if (!this.esAvailable) return;

    try {
      await this.es.index({
        index: INGREDIENT_INDEX,
        id: String(ingredient.id),
        document: {
          id: ingredient.id,
          ingredientName: ingredient.ingredientName,
          description: ingredient.description,
          imageUrl: ingredient.imageUrl,
          allergenNames: ingredient.ingredientAllergens.map(
            (ia) => ia.allergen.name,
          ),
        },
      });
      this.markAvailable();
    } catch (error) {
      this.markUnavailable(error, 'indexing ingredient');
    }
  }

  async removeFood(foodId: number) {
    if (!this.esAvailable) return;
    try {
      await this.es.delete({ index: FOOD_INDEX, id: String(foodId) });
      this.markAvailable();
    } catch (error) {
      this.markUnavailable(error, 'removing food from index');
    }
  }

  async removeIngredient(ingredientId: number) {
    if (!this.esAvailable) return;
    try {
      await this.es.delete({ index: INGREDIENT_INDEX, id: String(ingredientId) });
      this.markAvailable();
    } catch (error) {
      this.markUnavailable(error, 'removing ingredient from index');
    }
  }

  // ─── Bulk Reindex ───────────────────────────────────────────────────────────

  async reindexAllFoods() {
    this.logger.log('Reindexing all foods...');
    try {
      await this.es.indices.delete({ index: FOOD_INDEX });
      this.logger.log(`Index "${FOOD_INDEX}" deleted for recreation`);
    } catch { /* ignore if not exists */ }
    await this.ensureFoodIndex();
    const foods = await this.prisma.food.findMany({ select: { id: true } });
    for (const f of foods) {
      await this.indexFood(f.id);
    }
    this.logger.log(`Reindexed ${foods.length} foods`);
    return { indexed: foods.length };
  }

  async reindexAllIngredients() {
    this.logger.log('Reindexing all ingredients...');
    try {
      await this.es.indices.delete({ index: INGREDIENT_INDEX });
      this.logger.log(`Index "${INGREDIENT_INDEX}" deleted for recreation`);
    } catch { /* ignore if not exists */ }
    await this.ensureIngredientIndex();
    const ingredients = await this.prisma.ingredient.findMany({ select: { id: true } });
    for (const i of ingredients) {
      await this.indexIngredient(i.id);
    }
    this.logger.log(`Reindexed ${ingredients.length} ingredients`);
    return { indexed: ingredients.length };
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  async getStatus() {
    if (!this.esAvailable) {
      return { elasticsearch: 'disconnected', foodsIndexed: 0, ingredientsIndexed: 0 };
    }
    try {
      const [foodCount, ingredientCount] = await Promise.all([
        this.es.count({ index: FOOD_INDEX }).then((r) => r.count).catch(() => 0),
        this.es.count({ index: INGREDIENT_INDEX }).then((r) => r.count).catch(() => 0),
      ]);
      return { elasticsearch: 'connected', foodsIndexed: foodCount, ingredientsIndexed: ingredientCount };
    } catch {
      return { elasticsearch: 'error', foodsIndexed: 0, ingredientsIndexed: 0 };
    }
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  async searchFoods(query: string, size = 20) {
    if (!this.esAvailable) return [];

    let result;
    try {
      result = await this.es.search({
        index: FOOD_INDEX,
        size,
        query: {
          multi_match: {
            query,
            fields: ['foodName^3', 'description', 'categoryName'],
            fuzziness: 'AUTO',
          },
        },
        highlight: {
          fields: { foodName: {}, description: {} },
        },
      });
      this.markAvailable();
    } catch (error) {
      this.markUnavailable(error, 'searching foods');
      return [];
    }

    return result.hits.hits.map((hit) => ({
      ...(hit._source as object),
      score: hit._score,
      highlight: hit.highlight,
    }));
  }

  async searchIngredients(query: string, size = 20) {
    if (!this.esAvailable) return [];

    let result;
    try {
      result = await this.es.search({
        index: INGREDIENT_INDEX,
        size,
        query: {
          multi_match: {
            query,
            fields: ['ingredientName^3', 'description', 'allergenNames'],
            fuzziness: 'AUTO',
          },
        },
        highlight: {
          fields: { ingredientName: {}, description: {} },
        },
      });
      this.markAvailable();
    } catch (error) {
      this.markUnavailable(error, 'searching ingredients');
      return [];
    }

    return result.hits.hits.map((hit) => ({
      ...(hit._source as object),
      score: hit._score,
      highlight: hit.highlight,
    }));
  }

  async searchAll(query: string, size = 20) {
    const [foods, ingredients] = await Promise.all([
      this.searchFoods(query, size),
      this.searchIngredients(query, size),
    ]);
    return { foods, ingredients };
  }
}
