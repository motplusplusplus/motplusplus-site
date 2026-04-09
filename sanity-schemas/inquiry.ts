// inquiry — contact form submissions

export default {
  name: 'inquiry',
  title: 'Inquiry',
  type: 'document',
  fields: [
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: '+1 trash', value: 'trash' },
          { title: 'a.Farm residency', value: 'residency' },
          { title: '+1 museum', value: 'museum' },
        ],
      },
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Read', value: 'read' },
          { title: 'Replied', value: 'replied' },
        ],
        layout: 'radio',
      },
      initialValue: 'new',
    },
    {
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 6,
      readOnly: true,
    },
    {
      name: 'artworkTitle',
      title: 'Artwork title',
      type: 'string',
      readOnly: true,
      description: 'For +1 trash inquiries.',
    },
    {
      name: 'studioType',
      title: 'Studio / accommodation',
      type: 'string',
      readOnly: true,
      description: 'For residency inquiries.',
    },
    {
      name: 'startMonth',
      title: 'Preferred start month',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'duration',
      title: 'Duration',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'portfolioUrl',
      title: 'Portfolio / website URL',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'locationName',
      title: 'Museum location name',
      type: 'string',
      readOnly: true,
      description: 'For +1 museum inquiries.',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
    },
    prepare({ title, subtitle }: { title: string; subtitle: string }) {
      const typeLabel: Record<string, string> = {
        trash: '+1 trash',
        residency: 'a.Farm residency',
        museum: '+1 museum',
      };
      return { title, subtitle: typeLabel[subtitle] || subtitle };
    },
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
};
