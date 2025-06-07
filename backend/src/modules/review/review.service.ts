import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

export interface ReviewWithUser {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  title: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email?: string;
  };
}

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ReviewWithUser> {
    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
      isApproved: true // Auto-approve for now, can add moderation later
    });

    const savedReview = await this.reviewRepository.save(review);
    return this.findOne(savedReview.id);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    reviews: ReviewWithUser[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      relations: ['user'],
      where: { isApproved: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      reviews: reviews as ReviewWithUser[],
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findByUser(userId: string): Promise<ReviewWithUser[]> {
    const reviews = await this.reviewRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
    return reviews as ReviewWithUser[];
  }

  async getOverallStats(): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      [key: number]: number;
    };
  }> {
    const reviews = await this.reviewRepository.find({
      where: { isApproved: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
      ratingDistribution
    };
  }

  async findOne(id: string): Promise<ReviewWithUser> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review as ReviewWithUser;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<ReviewWithUser> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    await this.reviewRepository.update(id, updateReviewDto);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.delete(id);
  }

  // Admin methods
  async findAllForAdmin(page: number = 1, limit: number = 10): Promise<{
    reviews: ReviewWithUser[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      reviews: reviews as ReviewWithUser[],
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async approveReview(id: string): Promise<ReviewWithUser> {
    await this.reviewRepository.update(id, { isApproved: true });
    return this.findOne(id);
  }

  async rejectReview(id: string): Promise<ReviewWithUser> {
    await this.reviewRepository.update(id, { isApproved: false });
    return this.findOne(id);
  }
} 