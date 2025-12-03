/**
 * Base repository class with common database operations
 */

import { Collection, Document, Filter, UpdateFilter, WithId, OptionalId } from 'mongodb';
import { getDatabase } from './connection';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Generic repository base class
 */
export abstract class BaseRepository<T extends Document> {
  protected abstract collectionName: string;

  /**
   * Get the MongoDB collection
   */
  protected getCollection(): Collection<T> {
    const db = getDatabase();
    return db.collection<T>(this.collectionName);
  }

  /**
   * Find a single document by filter
   */
  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne(filter);
    } catch (error) {
      logger.error(`Error finding document in ${this.collectionName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database query failed');
    }
  }

  /**
   * Find a single document by ID
   */
  async findById(id: string): Promise<WithId<T> | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ _id: id } as Filter<T>);
    } catch (error) {
      logger.error(`Error finding document by ID in ${this.collectionName}`, {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database query failed');
    }
  }

  /**
   * Find multiple documents
   */
  async find(filter: Filter<T> = {}, limit?: number): Promise<WithId<T>[]> {
    try {
      const collection = this.getCollection();
      let query = collection.find(filter);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query.toArray();
    } catch (error) {
      logger.error(`Error finding documents in ${this.collectionName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database query failed');
    }
  }

  /**
   * Insert a single document
   */
  async insertOne(document: OptionalId<T>): Promise<WithId<T>> {
    try {
      const collection = this.getCollection();
      const result = await collection.insertOne(document);
      
      return { ...document, _id: result.insertedId } as WithId<T>;
    } catch (error) {
      logger.error(`Error inserting document into ${this.collectionName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database insert failed');
    }
  }

  /**
   * Update a single document
   */
  async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>
  ): Promise<WithId<T>> {
    try {
      const collection = this.getCollection();
      const result = await collection.findOneAndUpdate(filter, update, {
        returnDocument: 'after',
      });

      if (!result) {
        throw new NotFoundError('Document not found');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error(`Error updating document in ${this.collectionName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database update failed');
    }
  }

  /**
   * Delete a single document
   */
  async deleteOne(filter: Filter<T>): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteOne(filter);
      
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting document from ${this.collectionName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database delete failed');
    }
  }

  /**
   * Count documents matching filter
   */
  async count(filter: Filter<T> = {}): Promise<number> {
    try {
      const collection = this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      logger.error(`Error counting documents in ${this.collectionName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new InternalServerError('Database count failed');
    }
  }

  /**
   * Check if document exists
   */
  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }
}
