export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'invalid json' }, { status: 400 });
  }

  const { type, name, email, message } = body;
  if (!type || !name || !email || !message) {
    return Response.json({ success: false, error: 'missing required fields' }, { status: 400 });
  }

  const doc = {
    _type: 'inquiry',
    _id: 'inquiry-' + Date.now(),
    type,
    submittedAt: new Date().toISOString(),
    name,
    email,
    message,
    status: 'new',
  };

  if (body.artworkTitle !== undefined) doc.artworkTitle = body.artworkTitle;
  if (body.artworkId !== undefined) doc.artworkId = body.artworkId;
  if (body.studioType !== undefined) doc.studioType = body.studioType;
  if (body.startMonth !== undefined) doc.startMonth = body.startMonth;
  if (body.duration !== undefined) doc.duration = body.duration;
  if (body.portfolioUrl !== undefined) doc.portfolioUrl = body.portfolioUrl;
  if (body.locationName !== undefined) doc.locationName = body.locationName;
  if (body.locationId !== undefined) doc.locationId = body.locationId;

  // Save to Sanity
  if (env.SANITY_WRITE_TOKEN) {
    try {
      const sanityRes = await fetch(
        'https://t5nsm79o.api.sanity.io/v2021-10-21/data/mutate/production',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
          },
          body: JSON.stringify({ mutations: [{ create: doc }] }),
        }
      );
      if (!sanityRes.ok) {
        const errText = await sanityRes.text();
        console.error('Sanity error:', errText);
      }
    } catch (err) {
      console.error('Sanity fetch failed:', err);
    }
  } else {
    console.log('SANITY_WRITE_TOKEN not set — skipping Sanity save');
  }

  // Send email notification via Resend
  if (env.RESEND_API_KEY) {
    try {
      let toEmail;
      if (type === 'trash') {
        toEmail = 'motplusplusplus@gmail.com';
      } else if (type === 'residency') {
        toEmail = 'a.farm.saigon@gmail.com';
      } else if (type === 'museum') {
        toEmail = body.hostEmail || 'motplusplusplus@gmail.com';
      } else {
        toEmail = 'motplusplusplus@gmail.com';
      }

      const subjectMap = {
        trash: `+1 trash inquiry — ${body.artworkTitle || 'artwork'} — ${name}`,
        residency: `a.Farm residency inquiry — ${name}`,
        museum: `+1 museum inquiry — ${body.locationName || 'location'} — ${name}`,
      };

      const lines = [
        `type: ${type}`,
        `name: ${name}`,
        `email: ${email}`,
        body.artworkTitle ? `artwork: ${body.artworkTitle}` : null,
        body.studioType ? `studio: ${body.studioType}` : null,
        body.startMonth ? `start month: ${body.startMonth}` : null,
        body.duration ? `duration: ${body.duration}` : null,
        body.portfolioUrl ? `portfolio: ${body.portfolioUrl}` : null,
        body.locationName ? `location: ${body.locationName}` : null,
        '',
        message,
      ].filter((l) => l !== null);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'motplusplus inquiries <inquiries@motplusplus.com>',
          to: [toEmail],
          reply_to: email,
          subject: subjectMap[type] || `inquiry — ${name}`,
          text: lines.join('\n'),
        }),
      });
    } catch (err) {
      console.error('Resend email failed:', err);
    }
  }

  return Response.json({ success: true });
}
