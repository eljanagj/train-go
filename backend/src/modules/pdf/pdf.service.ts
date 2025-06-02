import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Reservation } from '../reservation/entities/reservation.entity';

export interface TicketData {
  reservation: Reservation;
  passengerName?: string;
  passengerSurname?: string;
  ticketNumber?: string;
}

@Injectable()
export class PdfService {
  async generateTicketPdf(ticketData: TicketData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      const html = this.generateTicketHtml(ticketData);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateTicketHtml(ticketData: TicketData): string {
    const { reservation, passengerName, passengerSurname, ticketNumber } = ticketData;
    const departureDate = new Date(reservation.schedule.departureTime);
    const arrivalDate = new Date(reservation.schedule.arrivalTime);

    // Use passenger info from reservation if not provided in ticketData
    const finalPassengerName = passengerName || reservation.passengerName || 'N/A';
    const finalPassengerSurname = passengerSurname || reservation.passengerSurname || 'N/A';

    // Format dates and times
    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Train Ticket</title>
        <style>
            body {
                font-family: 'Times New Roman', serif;
                margin: 0;
                padding: 20px;
                background-color: white;
                color: black;
                line-height: 1.4;
            }
            .ticket {
                background: white;
                border: 2px solid black;
                max-width: 210mm;
                margin: 0 auto;
                page-break-inside: avoid;
            }
            .ticket-header {
                border-bottom: 2px solid black;
                padding: 20px;
                text-align: center;
                background: white;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            .ticket-type {
                font-size: 16px;
                margin: 5px 0 0 0;
                font-weight: normal;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .ticket-number {
                font-size: 12px;
                margin: 10px 0 0 0;
                font-family: 'Courier New', monospace;
            }
            .ticket-body {
                padding: 0;
            }
            .route-section {
                border-bottom: 1px solid black;
                padding: 20px;
            }
            .route-header {
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 15px;
                letter-spacing: 1px;
            }
            .route-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .station {
                text-align: center;
                flex: 1;
            }
            .station-name {
                font-size: 18px;
                font-weight: bold;
                margin: 0;
                text-transform: uppercase;
            }
            .station-date {
                font-size: 12px;
                margin: 5px 0 0 0;
            }
            .station-time {
                font-size: 16px;
                font-weight: bold;
                margin: 2px 0 0 0;
            }
            .route-arrow {
                flex: 0 0 60px;
                text-align: center;
                font-size: 20px;
                font-weight: bold;
            }
            .details-section {
                border-bottom: 1px solid black;
                padding: 20px;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .detail-item {
                border: 1px solid black;
                padding: 10px;
            }
            .detail-label {
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
                border-bottom: 1px solid black;
                padding-bottom: 3px;
            }
            .detail-value {
                font-size: 14px;
                font-weight: bold;
                margin-top: 5px;
            }
            .payment-section {
                border-bottom: 1px solid black;
                padding: 20px;
            }
            .payment-header {
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 15px;
                text-align: center;
                letter-spacing: 1px;
            }
            .payment-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                font-size: 12px;
            }
            .payment-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px dotted black;
            }
            .reservation-section {
                padding: 20px;
                text-align: center;
            }
            .reservation-header {
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            .reservation-id {
                font-family: 'Courier New', monospace;
                font-size: 14px;
                border: 1px solid black;
                padding: 8px 15px;
                display: inline-block;
                margin: 10px 0;
                background: white;
            }
            .boarding-info {
                font-size: 11px;
                margin-top: 15px;
                text-align: center;
                font-style: italic;
            }
            .footer {
                text-align: center;
                padding: 15px;
                font-size: 10px;
                border-top: 1px solid black;
                background: white;
            }
            .terms {
                font-size: 9px;
                text-align: justify;
                margin-top: 10px;
                line-height: 1.2;
            }
        </style>
    </head>
    <body>
        <div class="ticket">
            <div class="ticket-header">
                <div class="company-name">Railway Transport Services</div>
                <div class="ticket-type">Passenger Ticket</div>
                <div class="ticket-number">Ticket No: ${ticketNumber || reservation.id.substring(0, 8).toUpperCase()}</div>
            </div>

            <div class="ticket-body">
                <div class="route-section">
                    <div class="route-header">Journey Details</div>
                    <div class="route-info">
                        <div class="station">
                            <div class="station-name">${reservation.schedule.route.departureStation}</div>
                            <div class="station-date">${formatDate(departureDate)}</div>
                            <div class="station-time">${formatTime(departureDate)}</div>
                        </div>
                        <div class="route-arrow">→</div>
                        <div class="station">
                            <div class="station-name">${reservation.schedule.route.arrivalStation}</div>
                            <div class="station-date">${formatDate(arrivalDate)}</div>
                            <div class="station-time">${formatTime(arrivalDate)}</div>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Passenger Name</div>
                            <div class="detail-value">${finalPassengerName.toUpperCase()} ${finalPassengerSurname.toUpperCase()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Train Service</div>
                            <div class="detail-value">${reservation.schedule.train.trainName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Seat Number</div>
                            <div class="detail-value">${reservation.seats.map(seat => seat.seatNumber).join(', ')}</div>
                            }</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fare</div>
                            <div class="detail-value">EUR ${parseFloat(reservation.price.toString()).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="payment-section">
                    <div class="payment-header">Payment Information</div>
                    <div class="payment-details">
                        <div class="payment-item">
                            <span>Payment Method:</span>
                            <span>${reservation.payment?.paymentMethod ? reservation.payment.paymentMethod.toUpperCase() : 'CARD'}</span>
                        </div>
                        ${reservation.payment?.paymentCardLast4 ? `
                        <div class="payment-item">
                            <span>Card Number:</span>
                            <span>****${reservation.payment.paymentCardLast4}</span>
                        </div>` : ''}
                        <div class="payment-item">
                            <span>Payment Date:</span>
                            <span>${reservation.payment?.paymentDate ? formatDate(new Date(reservation.payment.paymentDate)) : 'N/A'}</span>
                        </div>
                        <div class="payment-item">
                            <span>Transaction ID:</span>
                            <span>${reservation.payment?.transactionId ? reservation.payment.transactionId.substring(0, 16).toUpperCase() : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="reservation-section">
                    <div class="reservation-header">Reservation Reference</div>
                    <div class="reservation-id">${reservation.id.toUpperCase()}</div>
                    <div class="boarding-info">
                        Please present this ticket and a valid photo identification when boarding.<br>
                        Ticket is valid only for the specified date, time, and seat.<br>
                        No refunds or exchanges permitted after departure time.
                    </div>
                </div>
            </div>

            <div class="footer">
                <div>Railway Transport Services Ltd. | Customer Service: +1-800-RAILWAY</div>
                <div>Issued: ${formatDate(new Date())} ${formatTime(new Date())}</div>
                <div class="terms">
                    Terms and Conditions: This ticket is non-transferable and valid only for the journey specified.
                    Passengers must arrive at the station at least 15 minutes before departure.
                    The company reserves the right to refuse travel to passengers without valid identification.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
