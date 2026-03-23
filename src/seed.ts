import { initDb } from './db';
import db from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Real Unsplash photo collections - men and women portrait photos
const MALE_PHOTOS = [
  ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600','https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600'],
  ['https://images.unsplash.com/photo-1463453091185-61582044d556?w=600','https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=600','https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600'],
  ['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600','https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=600'],
  ['https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=600','https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600','https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600'],
  ['https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=600','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600','https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'],
  ['https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=600','https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600','https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600'],
  ['https://images.unsplash.com/photo-1553267751-1c148a7280a1?w=600','https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=600','https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600'],
  ['https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=600','https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=600','https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=600'],
  ['https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=600','https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600','https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=600'],
  ['https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=600','https://images.unsplash.com/photo-1604072366595-e75dc92d6bdc?w=600','https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=600'],
];

const FEMALE_PHOTOS = [
  ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600','https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600'],
  ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600','https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600','https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=600'],
  ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600','https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600'],
  ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600','https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=600','https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600'],
  ['https://images.unsplash.com/photo-1601412436405-1f0c6b50921f?w=600','https://images.unsplash.com/photo-1614289371518-722f2615943d?w=600','https://images.unsplash.com/photo-1581424030218-7b16d8c3ec3c?w=600'],
  ['https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600','https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=600','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600'],
  ['https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600','https://images.unsplash.com/photo-1560087637-bf797bc7796a?w=600','https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=600'],
  ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600','https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=600','https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600'],
  ['https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=600','https://images.unsplash.com/photo-1592621385612-4d7129426394?w=600','https://images.unsplash.com/photo-1604585625077-db543c5f8ff5?w=600'],
  ['https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=600','https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600','https://images.unsplash.com/photo-1609010697446-11f2155278f0?w=600'],
];

const MALE_NAMES = [
  'Aung Kyaw','Zaw Lin','Min Thu','Kyaw Zin','Htet Aung','Thura Myo','Yan Naing','Ko Ko',
  'Thant Zin','Nay Lin','Pyae Sone','Wai Yan','Kyaw Soe','Zin Ko','Hein Htet',
  'Myat Ko','Naing Htut','Aung Myo','Kaung Sat','Ye Htut','Zeyar Lwin','Min Khant',
  'Sithu Aung','Nyan Lin','Phyo Wai','Thway Ni','Kyaw Min','Zin Yaw','Htun Htun',
  'Soe Moe','Pyae Zone','Wai Phyo','Kyaw Kyaw','Aye Ko','Win Naing','Arkar Moe',
  'Thant Myat','Kaung Htet','Saw Htun','Zaw Moe','Min Zaw','Myat Zaw','Lamin Soe',
  'Thet Naing','Zin Min','Kyaw Htet','Nay Myo','Thura Lin','Ye Lin','Moe Lwin',
];

const FEMALE_NAMES = [
  'Thiri Aung','Su Su Lwin','Nway Nway','Aye Aye','Myo Myo','Khin Myo','Thazin',
  'Eindra Ko','Wint Yati','Hnin Wai','Phyo Phyo','Zin Mar','Myat Noe','Kay Khaing',
  'Nan Khin','Aye Mon','Thin Thin','Ni Ni','Su Myat','Khin Khin','Aye Aye Khaing',
  'Ma Ma Aye','May Thu','Pwint Phyu','Thida Oo','Hnin Oo','Kyi Kyi','Ei Ei',
  'Phyu Phyu','Wai Wai','Thet Thet','Yamin Oo','Zar Zar','Honey','Chan Myae',
  'Cho Cho','Khin Mar','Yin Yin','Nan Nan','May May','Hsu Hsu','Shwe Sin',
  'Moe Moe','Poe Poe','Lin Lin','Wint Wint','Shan Shan','Yu Yu','Kay Kay',
];

const BIOS = [
  'Software engineer who codes by day and explores street food by night 🍜',
  'Designer turning ugly things beautiful. Obsessed with Figma and iced matcha ☕',
  'Mobile dev passionate about building apps that matter 📱',
  'Finance nerd who secretly wants to be a travel blogger ✈️',
  'Marketing strategist with a data obsession. Avid cyclist 🚴',
  'Backend engineer building scalable systems. Guitar player by night 🎸',
  'HR professional who loves connecting people with opportunities 🤝',
  'Freelancer working from cafes across Yangon. Dog person 🐶',
  'Full stack developer. Hiking addict. Coffee snob ☕',
  'Product manager with an eye for design. Amateur chef 🍳',
  'Data analyst who turns numbers into stories 📊',
  'UI/UX designer crafting experiences users love ✨',
  'Startup founder building Myanmar\'s next big thing 🚀',
  'Digital nomad. Currently based in Yangon. Loves Inle Lake 🌅',
  'Network engineer keeping Myanmar connected 🌐',
  'Content creator sharing Myanmar culture with the world 🇲🇲',
  'Gaming enthusiast and indie game developer 🎮',
  'Doctor by day, foodie by night. Exploring hidden gems 🍜',
  'Teacher shaping the next generation. Weekend photographer 📸',
  'Entrepreneur with too many ideas. Needs a co-founder 😄',
];

const INTERESTS_POOL = [
  ['Technology','Travel','Coffee','Reading','Gaming'],
  ['Design','Art','Cats','Cinema','Fashion'],
  ['Music','Travel','Fitness','Cooking','Dogs'],
  ['Photography','Hiking','Art','Coffee','Reading'],
  ['Cycling','Cooking','Marketing','Travel','Data'],
  ['Finance','Yoga','Photography','Travel','Foodie'],
  ['Technology','Gaming','Music','Fitness','Coffee'],
  ['Reading','Travel','Cooking','Art','Cinema'],
  ['Sports','Fitness','Travel','Photography','Coffee'],
  ['Technology','Reading','Hiking','Dogs','Coffee'],
  ['Design','Fashion','Travel','Cinema','Coffee'],
  ['Music','Art','Travel','Yoga','Foodie'],
];

const JOBS = [
  'Software Engineer at TechCorp','UI/UX Designer at Creative Hub','Product Manager at Wave Money',
  'Backend Developer at Frontiir','Data Analyst at KBZ Bank','Marketing Manager at Grab',
  'Freelance Developer','HR Manager at TotalEnergies','DevOps Engineer at MPT',
  'Mobile Developer at AYA Bank','Finance Analyst at MAB','Content Creator',
  'Full Stack Developer at Ooredoo','Network Engineer at Mytel','Business Analyst at CB Bank',
];

const EDUCATIONS = [
  'B.Sc Computer Science, Yangon University',
  'B.E Software Engineering, UCSY',
  "B.Sc Information Technology, Dagon University",
  "Master's in Business Administration, YUDE",
  'B.Com Accounting, University of Economics',
  'B.E Electrical Engineering, MTU',
  'B.Sc Physics, Mandalay University',
  "Bachelor's in Design, Myanmar Institute of Information Technology",
  'B.E Computer Engineering, RIT',
  'Medical Degree, University of Medicine',
];

const AREAS = ['Yangon','Mandalay','Naypyidaw','Bago','Yangon'];

async function seed() {
  await initDb();
  console.log('🌱 Seeding...');

  // Clear all
  for (const tbl of ['match_actions','matches','messages','matchmaking_profiles','job_applications','saved_jobs','marketplace_listings','jobs','reviews','users']) {
    await db.exec(`DELETE FROM ${tbl}`);
  }

  const hash = await bcrypt.hash('password123', 10);

  // ── Core demo users ──────────────────────────────────────────────────────
  const coreUsers = [
    { id: uuidv4(), name: 'Aung Kyaw', email: 'aung@demo.com', role: 'job_seeker', phone: '09-123456789', address: 'Yangon, Myanmar', birthday: '1995-03-15', education: EDUCATIONS[0], experience: '3 years as Frontend Developer at TechCorp Myanmar.', skills: JSON.stringify(['React','TypeScript','Node.js','Python']), bio: 'Passionate software engineer who loves building great user experiences.', company_name: null },
    { id: uuidv4(), name: 'Thiri Aung', email: 'thiri@demo.com', role: 'job_seeker', phone: '09-234567890', address: 'Yangon, Myanmar', birthday: '1998-07-22', education: EDUCATIONS[1], experience: 'Software Engineer at TechCorp for 2 years.', skills: JSON.stringify(['Flutter','Dart','React Native','Firebase']), bio: 'Mobile developer passionate about building beautiful apps.', company_name: null },
    { id: uuidv4(), name: 'Kyaw Zin Htet', email: 'kyawzin@demo.com', role: 'job_seeker', phone: '09-345678901', address: 'Mandalay, Myanmar', birthday: '1996-11-05', education: EDUCATIONS[5], experience: '2 years as Backend Developer at Frontiir.', skills: JSON.stringify(['Python','Django','PostgreSQL','Docker']), bio: 'Backend engineer who loves scalable systems.', company_name: null },
    { id: uuidv4(), name: 'Nway Nway', email: 'nway@demo.com', role: 'job_seeker', phone: '09-456789012', address: 'Yangon, Myanmar', birthday: '1999-02-14', education: EDUCATIONS[2], experience: '1.5 years as UI/UX Designer at Creative Hub.', skills: JSON.stringify(['Figma','Adobe XD','Illustrator']), bio: 'Creative designer bridging beautiful design and great UX.', company_name: null },
    { id: uuidv4(), name: 'Phyo Wai', email: 'phyo@demo.com', role: 'job_seeker', phone: '09-567890123', address: 'Yangon, Myanmar', birthday: '1993-09-30', education: EDUCATIONS[3], experience: '4 years in Digital Marketing at Wave Money.', skills: JSON.stringify(['Digital Marketing','SEO','Google Ads']), bio: 'Growth-oriented digital marketer in Myanmar fintech.', company_name: null },
    { id: uuidv4(), name: 'Su Su Lwin', email: 'susu@demo.com', role: 'job_seeker', phone: '09-678901234', address: 'Yangon, Myanmar', birthday: '1997-05-18', education: EDUCATIONS[4], experience: '3 years as Financial Analyst at MAB.', skills: JSON.stringify(['Financial Analysis','Excel','SQL']), bio: 'Detail-oriented finance professional.', company_name: null },
    { id: uuidv4(), name: 'Min Thu', email: 'min@techcorp.com', role: 'recruiter', phone: '09-789012345', address: 'Yangon, Myanmar', birthday: '1988-04-12', education: 'MBA, INSEAD', experience: '8 years HR Management.', skills: JSON.stringify(['Talent Acquisition','HR Strategy']), bio: 'HR Director at TechCorp Myanmar.', company_name: 'TechCorp Myanmar' },
    { id: uuidv4(), name: 'Ei Phyu', email: 'ei@wavemoney.com', role: 'recruiter', phone: '09-890123456', address: 'Yangon, Myanmar', birthday: '1990-08-25', education: "Master's HRM", experience: '6 years recruiting for fintech.', skills: JSON.stringify(['Recruitment']), bio: "Building Wave Money's engineering team.", company_name: 'Wave Money' },
    { id: uuidv4(), name: 'Zaw Lin', email: 'zaw@frontiir.com', role: 'recruiter', phone: '09-901234567', address: 'Yangon, Myanmar', birthday: '1985-12-01', education: 'B.E Computer Engineering', experience: '10 years in tech.', skills: JSON.stringify(['Technical Recruiting']), bio: 'Ex-engineer turned recruiter.', company_name: 'Frontiir Internet' },
  ];

  for (const u of coreUsers) {
    await db.run('INSERT INTO users (id,name,email,password,role,phone,address,birthday,education,experience,skills,bio,company_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [u.id,u.name,u.email,hash,u.role,u.phone,u.address,u.birthday,u.education,u.experience,u.skills,u.bio,u.company_name]);
  }

  // ── 100 matchmaking users ────────────────────────────────────────────────
  const matchUsers: any[] = [];
  let maleIdx = 0, femaleIdx = 0;

  for (let i = 0; i < 100; i++) {
    const isMale = i % 2 === 0;
    const gender = isMale ? 'male' : 'female';
    const names = isMale ? MALE_NAMES : FEMALE_NAMES;
    const name = names[isMale ? maleIdx % names.length : femaleIdx % names.length];
    if (isMale) maleIdx++; else femaleIdx++;

    const age = 18 + Math.floor(Math.random() * 17); // 18-34
    const photoSet = isMale ? MALE_PHOTOS[i % MALE_PHOTOS.length] : FEMALE_PHOTOS[i % FEMALE_PHOTOS.length];
    // Give each person 2-4 photos
    const numPhotos = 2 + Math.floor(Math.random() * 3);
    const photos = photoSet.slice(0, Math.min(numPhotos, photoSet.length));

    const id = uuidv4();
    const email = `user${i + 100}@yk.demo`;
    const edu = EDUCATIONS[i % EDUCATIONS.length];
    const job = JOBS[i % JOBS.length];
    const bio = BIOS[i % BIOS.length];
    const interests = INTERESTS_POOL[i % INTERESTS_POOL.length];
    const area = AREAS[i % AREAS.length];

    await db.run('INSERT INTO users (id,name,email,password,role,phone,address,birthday,education,experience,skills,bio,company_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, name, email, hash, 'job_seeker',
       `09-${String(100000000 + i).slice(1)}`,
       `${area}, Myanmar`,
       `${1985 + Math.floor(Math.random() * 15)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2,'0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2,'0')}`,
       edu, job, JSON.stringify(['React','Python','Figma','Marketing'].slice(0, 2 + (i % 3))),
       bio, null]);

    matchUsers.push({ id, name, age, gender, bio, interests, area, edu, job, photos });
  }

  console.log(`✅ ${coreUsers.length + matchUsers.length} users`);

  // ── Insert matchmaking profiles for 100 users ────────────────────────────
  for (const u of matchUsers) {
    await db.run(`INSERT INTO matchmaking_profiles (id,user_id,age,gender,bio,interests,preferred_area,preferred_age_min,preferred_age_max,preferred_work_field,photos,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
      [uuidv4(), u.id, u.age, u.gender, u.bio, JSON.stringify(u.interests),
       u.area, 18, 45, 'Any', JSON.stringify(u.photos)]);
  }

  // Core seekers get profiles too
  const seekers = coreUsers.filter(u => u.role === 'job_seeker');
  const coreProfiles = [
    { u: seekers[0], age: 28, gender: 'male', photos: MALE_PHOTOS[0] },
    { u: seekers[1], age: 25, gender: 'female', photos: FEMALE_PHOTOS[0] },
    { u: seekers[2], age: 27, gender: 'male', photos: MALE_PHOTOS[1] },
    { u: seekers[3], age: 24, gender: 'female', photos: FEMALE_PHOTOS[1] },
    { u: seekers[4], age: 30, gender: 'male', photos: MALE_PHOTOS[2] },
    { u: seekers[5], age: 26, gender: 'female', photos: FEMALE_PHOTOS[2] },
  ];
  for (const p of coreProfiles) {
    await db.run(`INSERT INTO matchmaking_profiles (id,user_id,age,gender,bio,interests,preferred_area,preferred_age_min,preferred_age_max,preferred_work_field,photos,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
      [uuidv4(), p.u.id, p.age, p.gender, p.u.bio, JSON.stringify(INTERESTS_POOL[0]), 'Yangon', 18, 40, 'IT & Software', JSON.stringify(p.photos)]);
  }

  console.log(`✅ 106 matchmaking profiles`);

  // ── Jobs ─────────────────────────────────────────────────────────────────
  const recruiters = coreUsers.filter(u => u.role === 'recruiter');
  const jobs = [
    { r: recruiters[0], title: 'Senior React Developer', cat: 'IT & Software', type: 'Full-Time', loc: 'Yangon', min: 1500000, max: 2500000, promoted: 1, desc: 'Looking for an experienced React developer to join our growing product team.', req: 'React 3+ years, TypeScript, REST APIs.' },
    { r: recruiters[0], title: 'Flutter Mobile Developer', cat: 'IT & Software', type: 'Full-Time', loc: 'Yangon', min: 1200000, max: 2000000, promoted: 0, desc: 'Build our flagship mobile apps used by 500,000+ users.', req: 'Flutter 2+ years, Dart.' },
    { r: recruiters[0], title: 'UI/UX Designer', cat: 'Design', type: 'Full-Time', loc: 'Yangon', min: 900000, max: 1500000, promoted: 1, desc: 'Create beautiful interfaces for our enterprise products.', req: 'Figma expert, 2+ years UX.' },
    { r: recruiters[1], title: 'Backend Engineer (Python)', cat: 'IT & Software', type: 'Full-Time', loc: 'Yangon', min: 1800000, max: 3000000, promoted: 1, desc: "Build and scale APIs powering Myanmar's leading mobile wallet.", req: 'Python, Django, PostgreSQL.' },
    { r: recruiters[1], title: 'Digital Marketing Specialist', cat: 'Marketing', type: 'Full-Time', loc: 'Yangon', min: 800000, max: 1300000, promoted: 0, desc: "Drive user acquisition for Wave Money's 10M users.", req: 'Google Ads, Facebook Ads, SEO.' },
    { r: recruiters[1], title: 'Financial Analyst', cat: 'Finance', type: 'Full-Time', loc: 'Yangon', min: 1000000, max: 1800000, promoted: 0, desc: 'Analyze financial performance and guide strategic decisions.', req: 'Finance degree, Excel, SQL.' },
    { r: recruiters[2], title: 'DevOps Engineer', cat: 'IT & Software', type: 'Full-Time', loc: 'Yangon', min: 2000000, max: 3500000, promoted: 1, desc: 'Own our infrastructure and CI/CD pipelines.', req: 'Docker, Kubernetes, AWS.' },
    { r: recruiters[2], title: 'Network Engineer', cat: 'Engineering', type: 'Full-Time', loc: 'Mandalay', min: 900000, max: 1600000, promoted: 0, desc: 'Design and maintain our nationwide fiber network.', req: 'CCNA/CCNP, routing & switching.' },
    { r: recruiters[0], title: 'Product Manager', cat: 'IT & Software', type: 'Full-Time', loc: 'Yangon', min: 2000000, max: 3500000, promoted: 0, desc: 'Own the product roadmap for our B2B platform.', req: 'Product management 3+ years.' },
    { r: recruiters[1], title: 'React Native Developer', cat: 'IT & Software', type: 'Contract', loc: 'Remote', min: 2500000, max: 4000000, promoted: 0, desc: 'Build cross-platform mobile application. 6-month contract.', req: 'React Native 2+ years.' },
  ];
  const jobIds: string[] = [];
  for (const j of jobs) {
    const id = uuidv4(); jobIds.push(id);
    await db.run('INSERT INTO jobs (id,recruiter_id,title,company,description,requirements,location,salary_min,salary_max,currency,job_type,category,is_promoted,views) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, j.r.id, j.title, j.r.company_name, j.desc, j.req, j.loc, j.min, j.max, 'MMK', j.type, j.cat, j.promoted, Math.floor(Math.random()*500)+20]);
  }
  console.log(`✅ ${jobs.length} jobs`);

  // ── Applications ──────────────────────────────────────────────────────────
  const appData = [
    { job: jobIds[0], seeker: seekers[0], status: 'shortlisted', cover: 'I have 3 years React experience.' },
    { job: jobIds[0], seeker: seekers[1], status: 'reviewed', cover: 'React is my primary skill.' },
    { job: jobIds[1], seeker: seekers[1], status: 'pending', cover: 'Flutter is my passion — 3 apps on Play Store.' },
    { job: jobIds[2], seeker: seekers[3], status: 'accepted', cover: 'My Figma portfolio includes 2 enterprise apps.' },
    { job: jobIds[3], seeker: seekers[2], status: 'shortlisted', cover: 'Python and Django expert.' },
  ];
  for (const a of appData) {
    await db.run('INSERT INTO job_applications (id,job_id,applicant_id,cover_letter,status) VALUES (?,?,?,?,?)',
      [uuidv4(), a.job, a.seeker.id, a.cover, a.status]);
  }
  console.log(`✅ ${appData.length} applications`);

  // ── Marketplace ───────────────────────────────────────────────────────────
  const listings = [
    { s: seekers[0], title: 'Laptop HP Pavilion 15', desc: 'Brand new. Intel i5 12th Gen, 8GB RAM, 512GB SSD.', price: 850000, cat: 'Electronics', cond: 'new', loc: 'Yangon', phone: '09-123456789', images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'], promoted: 1 },
    { s: seekers[1], title: 'iPhone 13 Pro 256GB', desc: 'Used 8 months. Excellent condition. Sierra Blue.', price: 1200000, cat: 'Electronics', cond: 'like_new', loc: 'Yangon', phone: '09-234567890', images: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600'], promoted: 1 },
    { s: seekers[2], title: 'IKEA Standing Desk', desc: 'Height adjustable electric desk. 160x80cm. White.', price: 450000, cat: 'Furniture', cond: 'like_new', loc: 'Mandalay', phone: '09-345678901', images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600'], promoted: 0 },
    { s: seekers[3], title: 'Wacom Intuos Pro Tablet', desc: 'Large drawing tablet. 5 replacement nibs included.', price: 380000, cat: 'Electronics', cond: 'good', loc: 'Yangon', phone: '09-456789012', images: ['https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=600'], promoted: 0 },
    { s: seekers[4], title: 'Canon EOS 80D Camera', desc: 'DSLR with 18-135mm lens. Shutter count: 8,000.', price: 950000, cat: 'Electronics', cond: 'good', loc: 'Yangon', phone: '09-567890123', images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600'], promoted: 0 },
    { s: seekers[0], title: 'Herman Miller Aeron Chair', desc: 'Premium ergonomic office chair. Size B.', price: 1800000, cat: 'Furniture', cond: 'like_new', loc: 'Yangon', phone: '09-123456789', images: ['https://images.unsplash.com/photo-1541558869434-2840d308329a?w=600'], promoted: 1 },
    { s: seekers[2], title: 'Sony WH-1000XM5 Headphones', desc: 'Industry-leading noise cancellation. Used twice.', price: 420000, cat: 'Electronics', cond: 'like_new', loc: 'Mandalay', phone: '09-345678901', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], promoted: 0 },
    { s: seekers[1], title: 'iPad Pro 11" M2 256GB', desc: 'WiFi + Cellular. Space Grey. Apple Pencil 2 included.', price: 1400000, cat: 'Electronics', cond: 'like_new', loc: 'Yangon', phone: '09-234567890', images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'], promoted: 1 },
    { s: seekers[5], title: 'Accounting Textbooks Set', desc: 'CPA exam prep + ACCA F1-F9 materials.', price: 85000, cat: 'Books', cond: 'good', loc: 'Yangon', phone: '09-678901234', images: ['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600'], promoted: 0 },
    { s: seekers[4], title: 'Freelance Logo Design Service', desc: 'Professional logo. Unlimited revisions, 3-day delivery.', price: 120000, cat: 'Services', cond: 'new', loc: 'Yangon', phone: '09-567890123', images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600'], promoted: 0 },
  ];
  for (const l of listings) {
    await db.run('INSERT INTO marketplace_listings (id,seller_id,title,description,price,currency,category,condition,location,images,phone,is_promoted,views) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [uuidv4(), l.s.id, l.title, l.desc, l.price, 'MMK', l.cat, l.cond, l.loc, JSON.stringify(l.images), l.phone, l.promoted, Math.floor(Math.random()*200)+5]);
  }
  console.log(`✅ ${listings.length} listings`);

  // ── Reviews ───────────────────────────────────────────────────────────────
  const reviews = [
    { r: recruiters[0], d: seekers[0], rating: 5, comment: 'Excellent developer, very reliable.', ctx: 'HR Manager, TechCorp' },
    { r: seekers[4], d: seekers[0], rating: 4, comment: 'Delivered on time. Good communication.', ctx: 'Client' },
    { r: recruiters[1], d: seekers[4], rating: 5, comment: 'Outstanding marketing. Grew user base 40%.', ctx: 'Wave Money' },
  ];
  for (const r of reviews) {
    await db.run('INSERT INTO reviews (id,reviewer_id,reviewed_id,rating,comment,context) VALUES (?,?,?,?,?,?)',
      [uuidv4(), r.r.id, r.d.id, r.rating, r.comment, r.ctx]);
  }
  console.log(`✅ ${reviews.length} reviews`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts (password: password123):');
  for (const u of coreUsers) console.log(`  ${u.role === 'recruiter' ? '🏢' : '👤'} ${u.email}`);
  console.log('\n  + 100 matchmaking profiles ready to swipe!');

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
