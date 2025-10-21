import { WatchHistoryRepository, WatchHistory, CreateWatchHistoryRequest } from './WatchHistoryRepository';

export class WatchHistoryService {
  static async findByUserId(userId: number): Promise<WatchHistory[]> {
    const repo = new WatchHistoryRepository();
    return await repo.findByUserId(userId);
  }

  static async createOrUpdate(data: CreateWatchHistoryRequest): Promise<WatchHistory> {
    const repo = new WatchHistoryRepository();
    return await repo.createOrUpdate(data);
  }

  static async deleteByUserAndContent(userId: number, contentId: number): Promise<boolean> {
    const repo = new WatchHistoryRepository();
    return await repo.deleteByUserAndContent(userId, contentId);
  }

  static async deleteByUserId(userId: number): Promise<boolean> {
    const repo = new WatchHistoryRepository();
    return await repo.deleteByUserId(userId);
  }
}
