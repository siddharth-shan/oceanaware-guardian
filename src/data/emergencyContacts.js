export const emergencyContacts = {
  national: [
    {
      name: 'Emergency Services',
      number: '911',
      description: 'Fire, Police, Medical emergencies'
    },
    {
      name: 'National Fire Information Hotline',
      number: '1-800-468-4408',
      description: 'Report wildfire hazards and get fire information'
    },
    {
      name: 'Red Cross Disaster Relief',
      number: '1-800-733-2767',
      description: 'Emergency shelter and disaster assistance'
    }
  ],
  california: [
    {
      name: 'CAL FIRE Information Line',
      number: '1-800-468-4408',
      description: 'California fire information and reporting'
    },
    {
      name: 'California Office of Emergency Services',
      number: '1-916-845-8911',
      description: 'State emergency management'
    },
    {
      name: 'PG&E Emergency Line',
      number: '1-800-743-5000',
      description: 'Power outages and gas emergencies'
    },
    {
      name: 'Southern California Edison',
      number: '1-800-611-1911',
      description: 'Power outages and electrical emergencies'
    }
  ],
  local: {
    losAngeles: [
      {
        name: 'LA County Fire Department',
        number: '1-323-881-2411',
        description: 'Los Angeles County fire services'
      },
      {
        name: 'LA County Emergency Management',
        number: '1-626-300-2110',
        description: 'County emergency coordination'
      }
    ],
    sanFrancisco: [
      {
        name: 'SF Fire Department',
        number: '1-415-558-3200',
        description: 'San Francisco fire services'
      },
      {
        name: 'SF Emergency Management',
        number: '1-415-558-2700',
        description: 'City emergency coordination'
      }
    ]
  }
};

export const getContactsByLocation = (location) => {
  const contacts = [...emergencyContacts.national, ...emergencyContacts.california];
  
  if (location && location.toLowerCase().includes('los angeles')) {
    contacts.push(...emergencyContacts.local.losAngeles);
  } else if (location && location.toLowerCase().includes('san francisco')) {
    contacts.push(...emergencyContacts.local.sanFrancisco);
  }
  
  return contacts;
};