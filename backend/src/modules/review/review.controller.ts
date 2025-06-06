import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ReviewService, ReviewWithUser } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  create(@Body() createReviewDto: CreateReviewDto, @Req() req: any): Promise<ReviewWithUser> {
    return this.reviewService.create(createReviewDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all approved reviews' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of reviews' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.reviewService.findAll(parseInt(page), parseInt(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reviews')
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({ status: 200, description: 'Returns list of user reviews' })
  findMyReviews(@Req() req: any): Promise<ReviewWithUser[]> {
    return this.reviewService.findByUser(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overall review statistics' })
  @ApiResponse({ status: 200, description: 'Returns review statistics' })
  getStats() {
    return this.reviewService.getOverallStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiResponse({ status: 200, description: 'Returns the review' })
  findOne(@Param('id') id: string): Promise<ReviewWithUser> {
    return this.reviewService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req: any): Promise<ReviewWithUser> {
    return this.reviewService.update(id, updateReviewDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.reviewService.remove(id, req.user.id);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all reviews for admin (including unapproved)' })
  @ApiResponse({ status: 200, description: 'Returns all reviews for admin' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  findAllForAdmin(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.reviewService.findAllForAdmin(parseInt(page), parseInt(limit));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a review' })
  @ApiResponse({ status: 200, description: 'Review approved successfully' })
  approveReview(@Param('id') id: string): Promise<ReviewWithUser> {
    return this.reviewService.approveReview(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a review' })
  @ApiResponse({ status: 200, description: 'Review rejected successfully' })
  rejectReview(@Param('id') id: string): Promise<ReviewWithUser> {
    return this.reviewService.rejectReview(id);
  }
} 