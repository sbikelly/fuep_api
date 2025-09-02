import { Router } from 'express';

import { AdminPaymentController } from '../controllers/admin-payment.controller.js';

export function createAdminPaymentRoutes(adminPaymentController: AdminPaymentController): Router {
  const router = Router();

  // ============================================
  // Payment Purpose Management Routes
  // ============================================

  /**
   * @route POST /admin/payment-purposes
   * @desc Create a new payment purpose
   * @access Admin only
   */
  router.post(
    '/payment-purposes',
    adminPaymentController.createPaymentPurpose.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payment-purposes
   * @desc Get all payment purposes with optional filtering
   * @access Admin only
   */
  router.get(
    '/payment-purposes',
    adminPaymentController.getPaymentPurposes.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payment-purposes/stats
   * @desc Get payment purpose statistics
   * @access Admin only
   */
  router.get(
    '/payment-purposes/stats',
    adminPaymentController.getPaymentPurposeStatistics.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payment-purposes/:id
   * @desc Get payment purpose by ID
   * @access Admin only
   */
  router.get(
    '/payment-purposes/:id',
    adminPaymentController.getPaymentPurposeById.bind(adminPaymentController)
  );

  /**
   * @route PUT /admin/payment-purposes/:id
   * @desc Update payment purpose
   * @access Admin only
   */
  router.put(
    '/payment-purposes/:id',
    adminPaymentController.updatePaymentPurpose.bind(adminPaymentController)
  );

  /**
   * @route DELETE /admin/payment-purposes/:id
   * @desc Delete payment purpose (soft delete)
   * @access Admin only
   */
  router.delete(
    '/payment-purposes/:id',
    adminPaymentController.deletePaymentPurpose.bind(adminPaymentController)
  );

  // ============================================
  // Payment Management Routes
  // ============================================

  /**
   * @route GET /admin/payments
   * @desc Get all payments with filtering and pagination
   * @access Admin only
   */
  router.get('/payments', adminPaymentController.getAllPayments.bind(adminPaymentController));

  // ============================================
  // Analytics and Statistics Routes
  // ============================================

  /**
   * @route GET /admin/payments/stats
   * @desc Get payment statistics
   * @access Admin only
   */
  router.get(
    '/payments/stats',
    adminPaymentController.getPaymentStatistics.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payments/analytics/monthly
   * @desc Get payments by month for analytics
   * @access Admin only
   */
  router.get(
    '/payments/analytics/monthly',
    adminPaymentController.getPaymentsByMonth.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payments/analytics/revenue
   * @desc Get total revenue for a time range
   * @access Admin only
   */
  router.get(
    '/payments/analytics/revenue',
    adminPaymentController.getTotalRevenue.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payments/analytics/counts
   * @desc Get payment counts by status
   * @access Admin only
   */
  router.get(
    '/payments/analytics/counts',
    adminPaymentController.getPaymentCounts.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payments/analytics/by-status
   * @desc Get payments breakdown by status
   * @access Admin only
   */
  router.get(
    '/payments/analytics/by-status',
    adminPaymentController.getPaymentsByStatus.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payments/analytics/by-purpose
   * @desc Get payments breakdown by purpose
   * @access Admin only
   */
  router.get(
    '/payments/analytics/by-purpose',
    adminPaymentController.getPaymentsByPurpose.bind(adminPaymentController)
  );

  /**
   * @route GET /admin/payments/:id
   * @desc Get payment by ID
   * @access Admin only
   */
  router.get('/payments/:id', adminPaymentController.getPaymentById.bind(adminPaymentController));

  /**
   * @route POST /admin/payments/:id/verify
   * @desc Verify payment
   * @access Admin only
   */
  router.post(
    '/payments/:id/verify',
    adminPaymentController.verifyPayment.bind(adminPaymentController)
  );

  /**
   * @route POST /admin/payments/:id/refund
   * @desc Refund payment
   * @access Admin only
   */
  router.post(
    '/payments/:id/refund',
    adminPaymentController.refundPayment.bind(adminPaymentController)
  );

  return router;
}
