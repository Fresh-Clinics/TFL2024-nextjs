"use client";

import React, { useEffect, useRef } from 'react';
import { Calendar } from '@fullcalendar/core';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import luxonPlugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import scrollGridPlugin from '@fullcalendar/scrollgrid';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { DateTime } from 'luxon';

// Import additional events from events.tsx
import { additionalEvents } from './events';

const CalendarComponent = () => {
  const calendarRef = useRef(null);

  useEffect(() => {
    if (calendarRef.current) {
      const calendar = new Calendar(calendarRef.current, {
        plugins: [
          resourceTimeGridPlugin,
          luxonPlugin,
          interactionPlugin,
          scrollGridPlugin,
        ],
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        initialView: 'resourceTimeGridDay',
        initialDate: '2024-10-29',
        timeZone: 'Australia/Sydney',
        headerToolbar: {
          left: 'resourceTimeGridDay,resourceTimeGridThreeDay',
          center: 'title',
          right: 'prev,next',
        },
        views: {
          resourceTimeGridThreeDay: {
            type: 'resourceTimeGrid',
            duration: { days: 3 },
            buttonText: '3 Days',
          },
          resourceTimeGridDay: {
            type: 'resourceTimeGrid',
            duration: { days: 1 },
            buttonText: '1 Day',
          },
        },
        dayMinWidth: 150,
        height: 'auto',
        slotMinTime: '07:00',
        slotMaxTime: '23:00',
        resourceOrder: 'order_id',
        resources: getHardcodedResources(),
        events: (info, successCallback, failureCallback) => {
          const events = getCombinedEvents();
          successCallback(events);
        },
        businessHours: [
          { daysOfWeek: [2], startTime: '09:00', endTime: '18:30' },
          { daysOfWeek: [3], startTime: '07:30', endTime: '19:00' },
          { daysOfWeek: [4], startTime: '07:00', endTime: '22:30' },
        ],
        eventContent: function (arg) {
          if (arg.event && arg.event.title) {
            const borderColor = getCategoryBorderColor(arg.event.extendedProps.category);
            const displaySlots = arg.event.extendedProps.displaySlots && ['1', '2', '3', '4', '5', '6', '7', '8'].includes(arg.event.extendedProps.category);
            
            const showTitle = arg.event.extendedProps.category !== '12';

            return {
              html: `<div class="fc-event-content" style="border-top: 4px solid ${borderColor} !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                        ${showTitle ? `<div class="fc-event-title">${arg.event.title}</div>` : ''}
                        <div class="fc-event-slots">${displaySlots ? `Slots Available: ${arg.event.extendedProps.bookings_limit}` : ''}</div>
                     </div>`
            };
          } else {
            return { html: '<div class="fc-event-content"><div class="fc-event-title">Invalid Event</div></div>' };
          }
        },
        eventDidMount: (info) => {
          tippy(info.el, {
            content: `<div style="font-size: 1rem!important; font-family: Arial;"><strong>${info.event.title}</strong></div><br><div style="font-size: 0.9rem!important; font-family: Arial;">${info.event.extendedProps.description}</div>`,
            allowHTML: true,
            theme: 'light-border',
            placement: 'top',
          });
        },
        eventClick: (info) => {
          const event = info.event;

          // Convert start time to the correct date and time format
          const startDate = DateTime.fromJSDate(event.start).toFormat('yyyy-MM-dd');
          const startTime = DateTime.fromJSDate(event.start).toFormat('HH:mm:ss');

          // Assuming event ID matches service ID for the booking
          const serviceId = event.id;
          const categoryId = event.extendedProps.category || 1;

          // Construct the dynamic booking URL
          const bookingUrl = `https://thefreshlifeconference.simplybook.net/v2/#book/category/${categoryId}/service/${serviceId}/count/1/date/${startDate}/time/${startTime}/`;

          const startDateTime = formatTimeToAEST(new Date(event.extendedProps.rawStartTime));
          const endDateTime = formatTimeToAEST(new Date(event.extendedProps.rawEndTime));

          const popup = document.createElement('div');
          popup.className = 'popup-overlay';
          popup.innerHTML = `
            <div class="popup-content">
              <span class="close-popup" onclick="closePopup()">×</span>
              ${getResourceLogo(event.resourceId) ? `<img src="${getResourceLogo(event.resourceId)}" style="width: 100px; margin: 10px auto;" alt="Resource Logo">` : ''}
              <p><strong>${startDateTime} - ${endDateTime}</strong></p>
              <div style="font-size: 1rem!important; font-family: Arial; line-height:2;"><strong>${event.title}</strong></div>
              <div style="font-size: 0.9rem; font-family: Arial;">${event.extendedProps.description}</div>
              <div class="popup-footer" style="text-align: center; margin-top: 20px;">
                <button class="book-now-button" style="
                  background-color: #142652;
                  color: #ffffff;
                  padding: 10px 20px;
                  border-radius: 4px;
                  text-decoration: none;
                  font-family: Arial, sans-serif;
                  font-size: 16px;
                  display: inline-block;
                " id="bookNowButton">Book Now</button>
              </div>
              <div class="iframe-container" style="margin-top: 20px; width: 100%; height: 500px;">
                <!-- Iframe will be loaded here -->
              </div>
            </div>
          `;
          document.body.appendChild(popup);

          // Function to load the booking URL into the iframe
          const openBookingUrl = () => {
            const iframeContainer = popup.querySelector('.iframe-container');
            iframeContainer.innerHTML = `<iframe src="${bookingUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;
          };

          // Attach the click event to the "Book Now" button
          const bookNowButton = document.getElementById('bookNowButton');
          bookNowButton.addEventListener('click', openBookingUrl);
        },

        allDaySlot: false,
      });

      calendar.render();
    }
  }, []);

  // Helper function to close the popup
  const closePopup = () => {
    const popup = document.querySelector('.popup-overlay');
    if (popup) {
      popup.remove();
    }
  };

  return <div ref={calendarRef} id="calendar"></div>;
};

// Helper functions

function getCategoryBorderColor(category) {
  switch (category) {
    case '1': return '#142652';
    case '2': return '#142652';
    case '3': return '#142652';
    case '5': return '#4b6c59';
    case '6': return '#e8b2a6';
    case '7': return '#142652';
    case '8': return '#84cdb8';
    case '9': return '#84cdb8';
    case '10': return '#84cdb8';
    case '11': return '#cbe4e0';
    case '12': return '#ebf7f475 !important';
    default: return '#ebf7f475'; // Default color
  }
}

function formatTimeToAEST(date) {
  return DateTime.fromJSDate(date).setZone('Australia/Sydney').toFormat('h:mm a');
}

function getResourceLogo(resourceId) {
  const resource = getHardcodedResources().find(r => r.id === resourceId);
  return resource && resource.logo ? `image-files/${resource.logo}` : null;
}

function getCombinedEvents() {
  const hardcodedEvents = getHardcodedEvents();
  const processedAdditionalEvents = processAdditionalEvents(additionalEvents);
  return [...hardcodedEvents, ...processedAdditionalEvents];
}

function processAdditionalEvents(events) {
  const calendarEvents = [];
  events.forEach(event => {
    event.timeMatrix.forEach(timeMatrix => {
      Object.entries(timeMatrix.timeslots).forEach(([date, slots]) => {
        slots.forEach(slot => {
          const startDateTime = `${date}T${slot}`;
          const endDateTime = DateTime.fromISO(startDateTime)
            .plus({ minutes: parseInt(event.duration) })
            .toISO();
          
          calendarEvents.push({
            id: event.id,
            title: event.name,
            start: startDateTime,
            end: endDateTime,
            resourceId: timeMatrix.provider_id.toString(),
            description: event.description || '',
            bookings_limit: event.bookings_limit,
            category: event.categories[0],
            rawStartTime: startDateTime,
            rawEndTime: endDateTime,
            displaySlots: true,
          });
        });
      });
    });
  });
  return calendarEvents;
}

function getHardcodedEvents() {
  const resources = getHardcodedResources();
  const backgroundEvents = [
    // Hardcoded events for category 12 displayed across all resources
    {
      id: 'bg-event-1',
      title: 'Afternoon Tea',
      start: '2024-10-29T15:30:00',
      end: '2024-10-29T16:00:00',
      description: 'Networking Event',
      extendedProps: { category: '12', displaySlots: false },
      display: 'background',
    },
    // Add more events as needed
  ];

  const eventsAcrossResources = [];
  backgroundEvents.forEach(event => {
    resources.forEach(resource => {
      eventsAcrossResources.push({ ...event, resourceId: resource.id });
    });
  });

  return eventsAcrossResources;
}

function getHardcodedResources() {
  return [
    { id: '29', title: 'Woodlands Stage', category: 'Program', order_id: 'a', logo: ' ' },
    { id: '30', title: 'Fresh Lounge', category: 'Program', order_id: 'b', logo: ' ' },
    { id: '8', title: 'Merz | Room 1', category: 'Training Suites', order_id: 'c', logo: 'Merz.png' },
    { id: '23', title: 'Merz | Room 2', category: 'Training Suites', order_id: 'd', logo: 'Merz.png' },
    { id: '2', title: 'Galderma | Room 1', category: 'Training Suites', order_id: 'e', logo: 'Galderma.png' },
    { id: '24', title: 'Galderma | Room 2', category: 'Training Suites', order_id: 'f', logo: 'Galderma.png' },
    // Add more resources as needed
  ];
}

export default CalendarComponent;
