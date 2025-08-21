


export const averagePrices = {
  "Paris": 1000,
  "Lyon": 800,
  "Marseille": 700,
  "Toulouse": 600,
  "Nice": 500,
}

export const studentData = {
  name: "FARID",
  school: "ENSEEIHT",
  city: "Paris",
}


export const schoolsData = [
  { "id": 1, "name": "ENSEEIHT" },
  { "id": 2, "name": "ENSAT" },
  { "id": 3, "name": "SUPAERO" },
  { "id": 4, "name": "Écoles de commerce" },
  { "id": 5, "name": "Audencia Business School" },
  { "id": 6, "name": "Brest BS" },
  { "id": 7, "name": "Burgundy School of Business, Dijon, Lyon" },
  { "id": 8, "name": "CELSA" },
  { "id": 9, "name": "CFA ACE" },
  { "id": 10, "name": "EBS Paris" },
  { "id": 11, "name": "Ecole Supérieure De Communication Et De Publicité ISCOM" },
  { "id": 12, "name": "Ecole Supérieure de Publicité ESP" },
  { "id": 13, "name": "ECS – European Communication School MEDIA SCHOOL" },
  { "id": 14, "name": "EDC Paris Business School" },
  { "id": 15, "name": "EDHEC BS, Lille, Nice, Paris." },
  { "id": 16, "name": "EEMI" },
  { "id": 17, "name": "EFAP – L'école des nouveaux métiers de la communication" },
  { "id": 18, "name": "EFFICOM" },
  { "id": 19, "name": "EM Normandie" },
  { "id": 20, "name": "EM Strasbourg" },
  { "id": 21, "name": "EMC – Ecole supérieure des Métiers de l'Image, du son et de la création" },
  { "id": 22, "name": "EMLV, Paris La Défense" },
  { "id": 23, "name": "Emlyon business school" },
  { "id": 24, "name": "ENGDE – École supérieure de gestion et expertise comptable" },
  { "id": 25, "name": "ENSAE – École Nationale de la Statistique et de l'Administration Éco" }
];

// Function to extract URL parameters for iframe integration
export const getStudentDataFromURL = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return studentData;
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    name: urlParams.get('student_name') || urlParams.get('name') || studentData.name,
    school: urlParams.get('school_name') || urlParams.get('school') || studentData.school,
    city: urlParams.get('city') || studentData.city,
    language: urlParams.get('language') || urlParams.get('lang') || 'en'
  };
};
