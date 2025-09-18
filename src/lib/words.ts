// src/lib/words.ts
export type WordPair = { secret: string; hint: string; theme: string };

export const DEFAULT_WORDS: WordPair[] = [
  // Food
  { secret: 'Pizza', hint: 'Cheese', theme: 'food' },
  { secret: 'Burger', hint: 'Bun', theme: 'food' },
  { secret: 'Sushi', hint: 'Rice', theme: 'food' },
  { secret: 'Pasta', hint: 'Noodles', theme: 'food' },
  { secret: 'Chocolate', hint: 'Sweet', theme: 'food' },
  { secret: 'Apple', hint: 'Fruit', theme: 'food' },
  { secret: 'Coffee', hint: 'Caffeine', theme: 'food' },
  { secret: 'Bread', hint: 'Loaf', theme: 'food' },
  { secret: 'Ice Cream', hint: 'Cold', theme: 'food' },
  { secret: 'Salad', hint: 'Vegetables', theme: 'food' },

  // Jobs
  { secret: 'Doctor', hint: 'Hospital', theme: 'jobs' },
  { secret: 'Teacher', hint: 'Classroom', theme: 'jobs' },
  { secret: 'Chef', hint: 'Kitchen', theme: 'jobs' },
  { secret: 'Pilot', hint: 'Airplane', theme: 'jobs' },
  { secret: 'Police', hint: 'Badge', theme: 'jobs' },
  { secret: 'Firefighter', hint: 'Rescue', theme: 'jobs' },
  { secret: 'Artist', hint: 'Paint', theme: 'jobs' },
  { secret: 'Engineer', hint: 'Build', theme: 'jobs' },
  { secret: 'Farmer', hint: 'Field', theme: 'jobs' },
  { secret: 'Musician', hint: 'Instrument', theme: 'jobs' },

  // Places
  { secret: 'Bank', hint: 'Money', theme: 'places' },
  { secret: 'Airport', hint: 'Flight', theme: 'places' },
  { secret: 'School', hint: 'Students', theme: 'places' },
  { secret: 'Library', hint: 'Books', theme: 'places' },
  { secret: 'Museum', hint: 'Art', theme: 'places' },
  { secret: 'Park', hint: 'Trees', theme: 'places' },
  { secret: 'Beach', hint: 'Sand', theme: 'places' },
  { secret: 'Hospital', hint: 'Care', theme: 'places' },
  { secret: 'Restaurant', hint: 'Menu', theme: 'places' },
  { secret: 'Cinema', hint: 'Movies', theme: 'places' },

  // Objects
  { secret: 'Phone', hint: 'Call', theme: 'objects' },
  { secret: 'Laptop', hint: 'Computer', theme: 'objects' },
  { secret: 'Watch', hint: 'Time', theme: 'objects' },
  { secret: 'Camera', hint: 'Photo', theme: 'objects' },
  { secret: 'Pen', hint: 'Write', theme: 'objects' },
  { secret: 'Backpack', hint: 'Carry', theme: 'objects' },
  { secret: 'Bicycle', hint: 'Ride', theme: 'objects' },
  { secret: 'Key', hint: 'Lock', theme: 'objects' },
  { secret: 'Glasses', hint: 'Vision', theme: 'objects' },
  { secret: 'Umbrella', hint: 'Rain', theme: 'objects' },

  // Animals
  { secret: 'Dog', hint: 'Bark', theme: 'animals' },
  { secret: 'Cat', hint: 'Meow', theme: 'animals' },
  { secret: 'Elephant', hint: 'Trunk', theme: 'animals' },
  { secret: 'Lion', hint: 'Mane', theme: 'animals' },
  { secret: 'Tiger', hint: 'Stripe', theme: 'animals' },
  { secret: 'Horse', hint: 'Gallop', theme: 'animals' },
  { secret: 'Monkey', hint: 'Banana', theme: 'animals' },
  { secret: 'Bear', hint: 'Honey', theme: 'animals' },
  { secret: 'Dolphin', hint: 'Ocean', theme: 'animals' },
  { secret: 'Owl', hint: 'Night', theme: 'animals' },

  // Vehicles
  { secret: 'Car', hint: 'Drive', theme: 'vehicles' },
  { secret: 'Airplane', hint: 'Fly', theme: 'vehicles' },
  { secret: 'Boat', hint: 'Sail', theme: 'vehicles' },
  { secret: 'Train', hint: 'Track', theme: 'vehicles' },
  { secret: 'Motorcycle', hint: 'Ride', theme: 'vehicles' },
  { secret: 'Bicycle', hint: 'Pedal', theme: 'vehicles' },
  { secret: 'Truck', hint: 'Cargo', theme: 'vehicles' },
  { secret: 'Helicopter', hint: 'Rotor', theme: 'vehicles' },
  { secret: 'Submarine', hint: 'Underwater', theme: 'vehicles' },
  { secret: 'Bus', hint: 'Route', theme: 'vehicles' },

  // Nature
  { secret: 'Tree', hint: 'Leaves', theme: 'nature' },
  { secret: 'River', hint: 'Water', theme: 'nature' },
  { secret: 'Mountain', hint: 'Peak', theme: 'nature' },
  { secret: 'Ocean', hint: 'Salt', theme: 'nature' },
  { secret: 'Flower', hint: 'Petal', theme: 'nature' },
  { secret: 'Rain', hint: 'Drops', theme: 'nature' },
  { secret: 'Sun', hint: 'Light', theme: 'nature' },
  { secret: 'Moon', hint: 'Night', theme: 'nature' },
  { secret: 'Snow', hint: 'Cold', theme: 'nature' },
  { secret: 'Wind', hint: 'Breeze', theme: 'nature' },

  // Sports
  { secret: 'Football', hint: 'Goal', theme: 'sports' },
  { secret: 'Basketball', hint: 'Hoop', theme: 'sports' },
  { secret: 'Tennis', hint: 'Racket', theme: 'sports' },
  { secret: 'Baseball', hint: 'Bat', theme: 'sports' },
  { secret: 'Golf', hint: 'Hole', theme: 'sports' },
  { secret: 'Swimming', hint: 'Pool', theme: 'sports' },
  { secret: 'Cycling', hint: 'Helmet', theme: 'sports' },
  { secret: 'Running', hint: 'Track', theme: 'sports' },
  { secret: 'Boxing', hint: 'Gloves', theme: 'sports' },
  { secret: 'Skiing', hint: 'Snow', theme: 'sports' },

  // Household
  { secret: 'Table', hint: 'Furniture', theme: 'household' },
  { secret: 'Chair', hint: 'Sit', theme: 'household' },
  { secret: 'Lamp', hint: 'Light', theme: 'household' },
  { secret: 'Couch', hint: 'Comfort', theme: 'household' },
  { secret: 'Door', hint: 'Entry', theme: 'household' },
  { secret: 'Window', hint: 'Glass', theme: 'household' },
  { secret: 'Fridge', hint: 'Cold', theme: 'household' },
  { secret: 'Oven', hint: 'Heat', theme: 'household' },
  { secret: 'Sink', hint: 'Water', theme: 'household' },
  { secret: 'Clock', hint: 'Time', theme: 'household' },

  // Tech
  { secret: 'Computer', hint: 'Keyboard', theme: 'tech' },
  { secret: 'Smartphone', hint: 'Apps', theme: 'tech' },
  { secret: 'Internet', hint: 'Web', theme: 'tech' },
  { secret: 'Email', hint: 'Inbox', theme: 'tech' },
  { secret: 'Software', hint: 'Program', theme: 'tech' },
  { secret: 'Hardware', hint: 'Device', theme: 'tech' },
  { secret: 'Server', hint: 'Data', theme: 'tech' },
  { secret: 'Cloud', hint: 'Storage', theme: 'tech' },
  { secret: 'Battery', hint: 'Power', theme: 'tech' },
  { secret: 'Screen', hint: 'Display', theme: 'tech' },

];
