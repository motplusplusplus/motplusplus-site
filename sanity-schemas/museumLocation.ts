// +1 museum by any other name — Location/Work schema
// Paste this into your Sanity Studio schema

export default {
  name: 'museumLocation',
  title: 'Museum Location',
  type: 'document',
  fields: [
    {
      name: 'active',
      title: 'Active (show on map)',
      type: 'boolean',
      initialValue: true,
      description: 'Uncheck to hide this location from the map without deleting it.',
    },
    {
      name: 'title',
      title: 'Work title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'artist',
      title: 'Artist name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'medium',
      title: 'Medium',
      type: 'string',
      description: 'e.g. oil on canvas, video, sculpture',
    },
    {
      name: 'year',
      title: 'Year',
      type: 'number',
    },
    {
      name: 'description',
      title: 'Description / curatorial note',
      type: 'text',
      rows: 4,
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'images',
      title: 'Additional images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    },
    {
      name: 'location',
      title: 'Location (pin on map)',
      type: 'geopoint',
      description: 'Drop a pin on the map for this work\'s location.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'hostName',
      title: 'Host / venue name',
      type: 'string',
      description: 'Name of the person, business, or space hosting this work.',
    },
    {
      name: 'neighbourhood',
      title: 'Neighbourhood',
      type: 'string',
      description: 'e.g. Thảo Điền, Bình Thạnh, District 1',
    },
    {
      name: 'accessType',
      title: 'Access type',
      type: 'string',
      options: {
        list: [
          { title: 'Freely visible / open access', value: 'open' },
          { title: 'By appointment', value: 'appointment' },
          { title: 'Phone call required', value: 'phone' },
          { title: 'Introduction needed', value: 'introduction' },
          { title: 'Specific hours only', value: 'hours' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'accessDetails',
      title: 'Access details',
      type: 'text',
      rows: 3,
      description: 'Tell visitors exactly how to access this work. e.g. "Call +84 090 449 77 69 to arrange a visit" or "Ring the buzzer at the gate between 9am–5pm".',
    },
    {
      name: 'hours',
      title: 'Hours (if applicable)',
      type: 'string',
      description: 'e.g. Tuesday–Sunday, 10am–6pm',
    },
    {
      name: 'contactMethod',
      title: 'Contact method',
      type: 'string',
      description: 'Phone number, email, or other contact for arranging access.',
    },
    {
      name: 'hostEmail',
      title: 'Host email',
      type: 'string',
      description: 'Contact email for this location\'s host. Used for inquiry form notifications.',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'artist',
      media: 'mainImage',
    },
  },
};
