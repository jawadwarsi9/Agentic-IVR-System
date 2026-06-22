const hubspot = require('@hubspot/api-client');

const client = new hubspot.Client({
  accessToken:
    process.env.HUBSPOT_ACCESS_TOKEN
});

async function createOrUpdateLead({
  contactId,
  phone,
  name,
  country,
  vehicle,
  budget,
  intent
}) {

  const properties = {
    firstname: name || '',
    phone: phone || '',
    country: country || '',
    vehicle_interest: vehicle || '',
    budget: budget || '',
    purchase_intent: intent || ''
  };

  if (contactId) {
    return await client.crm.contacts.basicApi.update(
      contactId,
      { properties }
    );
  }

  return await client.crm.contacts.basicApi.create({
    properties
  });
}

module.exports = {
  createOrUpdateLead
};