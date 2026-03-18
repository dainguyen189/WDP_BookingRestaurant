const cron = require('node-cron');
const reservation = require('../models/reservation');


function getReservationDateTime(reservation) {
  return new Date(`${reservation.reservationDate.toISOString().split('T')[0]}T${reservation.reservationTime}:00`);
}

cron.schedule('*/2 * * * *', async () => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Fetch all pending reservations
    const pendingReservations = await reservation.find({ status: 'pending' });

    const expiredIds = pendingReservations
      .filter(reservation => {
        const reservationDateTime = getReservationDateTime(reservation);
        return reservationDateTime < fifteenMinutesAgo;
      })
      .map(reservation => reservation._id);

    if (expiredIds.length > 0) {
      const result = await reservation.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'expired' } }
      );
      console.log(`Expired ${result.modifiedCount} reservations`);
    }
  } catch (err) {
    console.error('Error expiring reservations:', err);
  }
});
