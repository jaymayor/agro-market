import { scheduleProductExpiryCheck } from './productExpiry.job';
import { scheduleOrderTimeoutCheck } from './orderTimeout.job';
import { scheduleCartCleanup } from './cartCleanup.job';
import { schedulePreOrderReminder } from './preOrderReminder.job';
import { scheduleSellerWeeklyReport } from './sellerWeeklyReport.job';
import { scheduleSellerPayments } from './sellerPayments.job';

export const startJobs = () => {
  scheduleProductExpiryCheck();
  scheduleOrderTimeoutCheck();
  scheduleCartCleanup();
  schedulePreOrderReminder();
  scheduleSellerWeeklyReport();
  scheduleSellerPayments();
  console.log('✅ Background jobs started');
};
