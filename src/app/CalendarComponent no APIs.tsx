"use client";

import React, { useEffect, useRef } from 'react';
import { Calendar } from '@fullcalendar/core';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import luxonPlugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import scrollGridPlugin from '@fullcalendar/scrollgrid';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { DateTime } from 'luxon'; // Import Luxon

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
          const events = getCombinedEvents(); // Combine hardcoded and additional events
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
            
            // For category 12, skip rendering the title
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
          const startDateTime = formatTimeToAEST(new Date(event.extendedProps.rawStartTime));
          const endDateTime = formatTimeToAEST(new Date(event.extendedProps.rawEndTime));

          const popup = document.createElement('div');
          popup.className = 'popup-overlay';
          popup.innerHTML = `
            <div class="popup-content">
                <span class="close-popup" onclick="this.parentElement.parentElement.remove()">×</span>
                ${getResourceLogo(event.resourceId) ? `<img src="${getResourceLogo(event.resourceId)}" style="width: 100px; margin: 10px auto;" alt="Resource Logo">` : ''}
                <p><strong>${startDateTime} - ${endDateTime}</strong></p>
                <div style="font-size: 1rem!important; font-family: Arial; line-height:2;"><strong>${event.title}</h3></strong></div>
                <div style="font-size: 0.9rem; font-family: Arial;">${event.extendedProps.description}</div>                  
                <div class="popup-footer">Bookings open Monday 23rd October at 7:00PM AEST</div>
            </div>
          `;
          document.body.appendChild(popup);
        },
        allDaySlot: false,
      });

      calendar.render();
    }
  }, []);

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

// Combine hardcoded events and events from events.tsx
function getCombinedEvents() {
  const hardcodedEvents = getHardcodedEvents();
  const processedAdditionalEvents = processAdditionalEvents(additionalEvents);
  const combinedEvents = [...hardcodedEvents, ...processedAdditionalEvents];
  return combinedEvents;
}

// Function to process additional events from events.tsx and convert timeMatrix into events
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
            category: event.categories[0], // Assuming the first category is used
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

// Hardcoded events for category 12 displayed across all resources
function getHardcodedEvents() {
  const resources = getHardcodedResources();
  const backgroundEvents = [
    {
      id: 'bg-event-1',
      title: 'Afternoon Tea',
      start: '2024-10-29T15:30:00',
      end: '2024-10-29T16:00:00',
      description: 'Networking Event',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-2',
      title: 'Lunch, Sponsor Activations & Networking',
      start: '2024-10-29T13:00:00',
      end: '2024-10-29T14:00:00',
      description: 'Lunch at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-3',
      title: 'Fresh Life Welcome Event',
      start: '2024-10-29T17:30:00',
      end: '2024-10-29T18:30:00',
      description: 'Welcome Event by Galderma',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-4',
      title: 'Morning Tea, Sponsor Activations & Networking',
      start: '2024-10-30T11:30:00',
      end: '2024-10-30T12:00:00',
      description: 'Morning Tea at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-5',
      title: 'Lunch, Sponsor Activations & Networking',
      start: '2024-10-30T13:30:00',
      end: '2024-10-30T14:30:00',
      description: 'Lunch at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-6',
      title: 'Afternoon Tea, Sponsor Activations & Networking',
      start: '2024-10-30T16:00:00',
      end: '2024-10-30T16:30:00',
      description: 'Afternoon Tea at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-7',
      title: 'Aperitivo Hour',
      start: '2024-10-30T17:30:00',
      end: '2024-10-30T18:30:00',
      description: 'Aperitivo Hour by Fresh Clinics Training Team',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-8',
      title: 'Morning Tea, Sponsor Activations & Networking',
      start: '2024-10-31T11:00:00',
      end: '2024-10-31T11:30:00',
      description: 'Morning Tea at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-9',
      title: 'Lunch, Sponsor Activations & Networking',
      start: '2024-10-31T13:30:00',
      end: '2024-10-31T14:30:00',
      description: 'Lunch at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-10',
      title: 'Afternoon Tea, Sponsor Activations & Networking',
      start: '2024-10-31T16:00:00',
      end: '2024-10-31T16:30:00',
      description: 'Afternoon Tea at Fresh Lounge',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
    {
      id: 'bg-event-11',
      title: 'Fright Night Finale',
      start: '2024-10-31T18:00:00',
      end: '2024-10-31T22:30:00',
      description: 'Fright Night Finale at Woodlands Stage',
      extendedProps: {
        category: '12',
        displaySlots: false,
      },
      display: 'background',
    },
  ];

  const eventsAcrossResources = [];
  backgroundEvents.forEach(event => {
    resources.forEach(resource => {
      eventsAcrossResources.push({ ...event, resourceId: resource.id });
    });
  });

  return eventsAcrossResources;
}

// Hardcoded resources
function getHardcodedResources() {
  return [
    { id: '29', title: 'Woodlands Stage', category: 'Program', order_id: 'a', logo: ' ' },
    { id: '30', title: 'Fresh Lounge', category: 'Program', order_id: 'b', logo: ' ' },
    { id: '8', title: 'Merz | Room 1', category: 'Training Suites', order_id: 'c', logo: 'Merz.png' },
    { id: '23', title: 'Merz | Room 2', category: 'Training Suites', order_id: 'd', logo: 'Merz.png' },
    { id: '2', title: 'Galderma | Room 1', category: 'Training Suites', order_id: 'e', logo: 'Galderma.png' },
    { id: '24', title: 'Galderma | Room 2', category: 'Training Suites', order_id: 'f', logo: 'Galderma.png' },
    { id: '3', title: 'Allergan', category: 'Training Suites', order_id: 'g', logo: 'Allergan.png' },
    { id: '4', title: 'Evolus', category: 'Training Suites', order_id: 'h', logo: 'Evolus.png' },
    { id: '7', title: 'Candela', category: 'Training Suites', order_id: 'i', logo: 'Candela.png' },
    { id: '14', title: 'Cryomed', category: 'Training Suites', order_id: 'j', logo: 'Cryomed.png' },
    { id: '13', title: 'Dermocosmetica | Room 1', category: 'Training Suites', order_id: 'k', logo: 'Dermocosmetica.png' },
    { id: '25', title: 'Dermocosmetica | Room 2', category: 'Training Suites', order_id: 'l', logo: 'Dermocosmetica.png' },
    { id: '9', title: 'EnVogue', category: 'Training Suites', order_id: 'm', logo: 'enVogue.png' },
    { id: '10', title: 'Hugel', category: 'Training Suites', order_id: 'n', logo: 'Hugel.png' },
    { id: '26', title: 'Rejuran', category: 'Training Suites', order_id: 'o', logo: 'Rejuran.png' },
    { id: '11', title: 'Teoxane', category: 'Training Suites', order_id: 'p', logo: 'Teoxane.png' },
    { id: '12', title: 'Xytide', category: 'Training Suites', order_id: 'q', logo: 'Xytide.png' },
    { id: '15', title: 'Fresh Clinics | Room 1', category: 'Training Suites', order_id: 'r', logo: 'Fresh-Clinics.png' },
    { id: '27', title: 'Fresh Clinics | Room 2', category: 'Training Suites', order_id: 's', logo: 'Fresh-Clinics.png' },
    { id: '31', title: 'Laser & Skin Training', category: 'Training Suites', order_id: 't', logo: 'Laser-Skin-Training.png' },
    { id: '20', title: 'Venus Concept', category: 'Activations Hub', order_id: 'u', logo: 'Venus.png' },
    { id: '19', title: 'Advanced Skin Technology', category: 'Activations Hub', order_id: 'v', logo: 'AST.png' },
    { id: '22', title: 'Fresh Tech Hub', category: 'Activations Hub', order_id: 'w', logo: 'fresh-tech-hub.png' },
    { id: '18', title: 'The Skincare Company', category: 'Activations Hub', order_id: 'x', logo: 'Skincare-Company.png' },
    { id: '21', title: 'Wellness Sessions', category: 'Wellness & Spa', order_id: 'y', logo: ' ' },
    { id: '16', title: 'The Fresh Spa', category: 'Wellness & Spa', order_id: 'z', logo: ' ' },
  ];
}

export default CalendarComponent;
