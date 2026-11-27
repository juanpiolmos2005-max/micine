// Tests de personalidad de MiCine. Textos originales; los nombres de personajes, casas y bandos
// se usan solo como referencia (sin logos ni escudos oficiales).
// Rasgos: v valentía · a astucia · l lealtad · r rebeldía · s sabiduría · m ambición · h humor · c corazón

export const TRAITS = ['v', 'a', 'l', 'r', 's', 'm', 'h', 'c'];
export const TRAIT_NAMES = { v: 'Valentía', a: 'Astucia', l: 'Lealtad', r: 'Rebeldía', s: 'Sabiduría', m: 'Ambición', h: 'Humor', c: 'Corazón' };

// Géneros de TMDB (pelis y series) para personalizar el resultado.
const ACC = 28, AVE = 12, ANI = 16, COM = 35, CRI = 80, DRA = 18, FAM = 10751, FAN = 14, TER = 27, MIS = 9648, ROM = 10749, SCI = 878, THR = 53, TVA = 10759, TVS = 10765;

// q: [m|t, título original en TMDB, año] para buscar la portada y saber si la viste.
export const CHARS = [
  { id: 'harry', name: 'Harry Potter', q: ['m', "Harry Potter and the Philosopher's Stone", 2001], g: [FAN, AVE, FAM], t: { v: 3, l: 3, c: 2, r: 1 }, d: 'Te tirás de cabeza cuando alguien necesita ayuda, aunque no tengas todas las respuestas. Tus amigos son tu familia.' },
  { id: 'hermione', name: 'Hermione Granger', q: ['m', "Harry Potter and the Philosopher's Stone", 2001], g: [FAN, AVE, FAM], t: { s: 3, v: 2, l: 2, m: 1 }, d: 'Llegás preparado a todo y no te conformás con "más o menos". Tu cabeza salva al grupo más veces de las que admiten.' },
  { id: 'ron', name: 'Ron Weasley', q: ['m', "Harry Potter and the Philosopher's Stone", 2001], g: [FAN, AVE, FAM, COM], t: { h: 3, l: 3, c: 1, v: 1 }, d: 'El alma del grupo: hacés reír en el peor momento y nunca dejás a nadie solo, aunque te tiemblen las piernas.' },
  { id: 'snape', name: 'Severus Snape', q: ['m', "Harry Potter and the Philosopher's Stone", 2001], g: [FAN, DRA], t: { a: 3, l: 2, s: 2, m: 1 }, d: 'Reservado y difícil de leer, pero con una lealtad profunda que pocos llegan a conocer.' },
  { id: 'gandalf', name: 'Gandalf', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE], t: { s: 3, v: 2, c: 1, h: 1 }, d: 'Sabés escuchar, aparecés justo cuando te necesitan y tus consejos valen oro (aunque a veces sean un misterio).' },
  { id: 'frodo', name: 'Frodo Bolsón', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE], t: { c: 3, v: 2, l: 2 }, d: 'Cargás con más de lo que te corresponde y seguís adelante. Tu fuerza está en no rendirte.' },
  { id: 'sam', name: 'Samwise Gamgee', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE], t: { l: 3, c: 3, h: 1 }, d: 'El amigo que todos merecen: si alguien no puede más, vos lo cargás. Sencillo, cálido e imparable.' },
  { id: 'aragorn', name: 'Aragorn', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE, ACC], t: { v: 3, l: 2, s: 1, m: 1 }, d: 'Líder sin buscarlo: preferís el camino difícil si es el correcto, y la gente te sigue.' },
  { id: 'legolas', name: 'Legolas', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE, ACC], t: { v: 2, a: 2, l: 2, s: 1 }, d: 'Preciso, tranquilo y con estilo. Ves los problemas antes que nadie y los resolvés con elegancia.' },
  { id: 'gollum', name: 'Gollum', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE], t: { m: 3, a: 2, r: 2 }, d: 'Cuando algo te obsesiona, no lo soltás. Tenés dos caras… y las dos tienen sus razones.' },
  { id: 'jack', name: 'Jack Sparrow', q: ['m', 'Pirates of the Caribbean: The Curse of the Black Pearl', 2003], g: [AVE, COM, FAN, ACC], t: { a: 3, h: 3, r: 3 }, d: 'Improvisás como nadie, siempre tenés un plan (o eso parece) y salís de cualquier lío con una sonrisa.' },
  { id: 'tony', name: 'Tony Stark', q: ['m', 'Iron Man', 2008], g: [ACC, SCI, AVE], t: { a: 3, h: 2, m: 2, r: 2 }, d: 'Brillante, ingenioso y un poco egocéntrico. Detrás del sarcasmo hay alguien que daría todo por los suyos.' },
  { id: 'steve', name: 'Steve Rogers', q: ['m', 'Captain America: The First Avenger', 2011], g: [ACC, SCI, AVE], t: { v: 3, l: 3, c: 2 }, d: 'Tus principios no se negocian. Te plantás contra cualquier abuso, aunque estés solo.' },
  { id: 'thor', name: 'Thor', q: ['m', 'Thor', 2011], g: [ACC, FAN, AVE], t: { v: 3, h: 2, c: 1, m: 1 }, d: 'Gran corazón, mucha energía y cero miedo al ridículo. Llenás cualquier lugar donde entrás.' },
  { id: 'loki', name: 'Loki', q: ['m', 'Thor', 2011], g: [FAN, ACC], t: { a: 3, m: 3, r: 2, h: 1 }, d: 'Estratega, impredecible y encantador. Nunca se sabe de qué lado estás… y eso te divierte.' },
  { id: 'natasha', name: 'Natasha Romanoff', q: ['m', 'The Avengers', 2012], g: [ACC, SCI, THR], t: { a: 3, v: 2, l: 2 }, d: 'Fría por fuera, leal por dentro. Leés a las personas como un libro abierto.' },
  { id: 'peter', name: 'Peter Parker', q: ['m', 'Spider-Man: Homecoming', 2017], g: [ACC, SCI, COM], t: { c: 3, h: 2, v: 2, s: 1 }, d: 'Buena onda, curioso y un poco torpe. Siempre intentás hacer lo correcto, aunque te cueste caro.' },
  { id: 'starlord', name: 'Star-Lord', q: ['m', 'Guardians of the Galaxy', 2014], g: [ACC, SCI, COM, AVE], t: { h: 3, r: 2, c: 2, v: 1 }, d: 'Pura actitud y buena música. Armás equipo con los más inesperados y de alguna forma funciona.' },
  { id: 'groot', name: 'Groot', q: ['m', 'Guardians of the Galaxy', 2014], g: [ACC, SCI, COM, AVE], t: { c: 3, l: 3 }, d: 'Hablás poco y das mucho. Tu cariño se nota en lo que hacés, no en lo que decís.' },
  { id: 'luke', name: 'Luke Skywalker', q: ['m', 'Star Wars', 1977], g: [SCI, AVE, ACC], t: { v: 3, c: 2, s: 1, r: 1 }, d: 'Soñás con algo más grande que tu lugar de origen y creés en lo mejor de cada persona.' },
  { id: 'leia', name: 'Leia Organa', q: ['m', 'Star Wars', 1977], g: [SCI, AVE, ACC], t: { v: 3, l: 2, s: 1, m: 1 }, d: 'Líder nata, directa y sin vueltas. Si nadie toma la iniciativa, la tomás vos.' },
  { id: 'han', name: 'Han Solo', q: ['m', 'Star Wars', 1977], g: [SCI, AVE, ACC], t: { r: 3, h: 2, a: 2 }, d: 'Te hacés el canchero y el que no le importa nada, pero cuando hace falta, volvés por tus amigos.' },
  { id: 'vader', name: 'Darth Vader', q: ['m', 'Star Wars', 1977], g: [SCI, AVE, ACC], t: { m: 3, v: 2, a: 1 }, d: 'Imponente y decidido. Cuando querés algo, nada te frena… aunque en el fondo siempre quede una chispa.' },
  { id: 'yoda', name: 'Yoda', q: ['m', 'Star Wars', 1977], g: [SCI, AVE, FAN], t: { s: 3, h: 1, c: 1 }, d: 'Paciencia infinita y respuestas que hacen pensar. Hablás poco y raro, pero siempre acertás.' },
  { id: 'mando', name: 'Din Djarin', q: ['t', 'The Mandalorian', 2019], g: [TVS, TVA], t: { l: 3, v: 2, c: 1 }, d: 'De pocas palabras y mucha palabra empeñada. Cuando adoptás a alguien, es para siempre.' },
  { id: 'batman', name: 'Bruce Wayne', q: ['m', 'The Dark Knight', 2008], g: [ACC, CRI, DRA], t: { a: 3, v: 3, m: 1 }, d: 'Preparado para todo, con un plan B, C y D. Cargás tus batallas en silencio.' },
  { id: 'joker', name: 'El Guasón', q: ['m', 'The Dark Knight', 2008], g: [ACC, CRI, THR], t: { r: 3, a: 3, h: 1 }, d: 'Caos creativo: rompés las reglas solo para ver qué pasa. (Tranqui, lo usás para el bien… ¿no?)' },
  { id: 'diana', name: 'Diana Prince', q: ['m', 'Wonder Woman', 2017], g: [ACC, FAN, AVE], t: { v: 3, c: 3, s: 1 }, d: 'Creés en las personas incluso cuando no se lo merecen, y peleás por ellas con todo.' },
  { id: 'katniss', name: 'Katniss Everdeen', q: ['m', 'The Hunger Games', 2012], g: [SCI, AVE, ACC], t: { v: 3, r: 2, l: 2 }, d: 'Protectora feroz de los tuyos. No buscás ser símbolo de nada, pero terminás inspirando a todos.' },
  { id: 'walter', name: 'Walter White', q: ['t', 'Breaking Bad', 2008], g: [DRA, CRI], t: { m: 3, a: 3, s: 1 }, d: 'Sos más brillante de lo que la gente cree, y cuando te subestiman… mejor que se cuiden.' },
  { id: 'sherlock', name: 'Sherlock Holmes', q: ['t', 'Sherlock', 2010], g: [CRI, DRA, MIS], t: { a: 3, s: 2, r: 1 }, d: 'Notás lo que nadie nota y te aburre la gente lenta. Tu mente nunca descansa.' },
  { id: 'eleven', name: 'Once (Eleven)', q: ['t', 'Stranger Things', 2016], g: [TVS, DRA, MIS], t: { c: 2, l: 2, v: 2, r: 1 }, d: 'Más fuerte de lo que parecés. Por tus amigos te animás a cualquier cosa, por rara que sea.' },
  { id: 'jon', name: 'Jon Snow', q: ['t', 'Game of Thrones', 2011], g: [TVS, DRA, TVA], t: { v: 3, l: 3, c: 1 }, d: 'Honor ante todo, aunque te cueste caro. Muchos te subestiman al principio… error.' },
  { id: 'dany', name: 'Daenerys Targaryen', q: ['t', 'Game of Thrones', 2011], g: [TVS, DRA, TVA], t: { m: 3, v: 2, r: 2 }, d: 'Tenés un destino claro y no pedís permiso para cumplirlo. Fuego puro.' },
  { id: 'tyrion', name: 'Tyrion Lannister', q: ['t', 'Game of Thrones', 2011], g: [TVS, DRA, TVA], t: { a: 3, h: 3, s: 2 }, d: 'Tu arma es la palabra: ingenio, humor y una lectura impecable de la gente.' },
  { id: 'arya', name: 'Arya Stark', q: ['t', 'Game of Thrones', 2011], g: [TVS, DRA, TVA], t: { r: 3, v: 2, a: 2 }, d: 'Independiente y testaruda. Nadie te dice quién tenés que ser.' },
  { id: 'michael', name: 'Michael Scott', q: ['t', 'The Office', 2005], g: [COM], t: { h: 3, c: 2 }, d: 'Querés que todos sean felices (y que te quieran). Torpe, intenso y adorable.' },
  { id: 'sheldon', name: 'Sheldon Cooper', q: ['t', 'The Big Bang Theory', 2007], g: [COM], t: { s: 3, h: 1, r: 1 }, d: 'Genio con manual de instrucciones propio. Tus rutinas son sagradas y tus datos, irrefutables.' },
  { id: 'joey', name: 'Joey Tribbiani', q: ['t', 'Friends', 1994], g: [COM, ROM], t: { h: 3, c: 2, l: 2 }, d: 'Simple, divertido y el mejor amigo del mundo. Eso sí: la comida no se comparte.' },
  { id: 'shrek', name: 'Shrek', q: ['m', 'Shrek', 2001], g: [ANI, COM, FAM, FAN], t: { h: 2, c: 2, r: 2 }, d: 'Gruñón por fuera, tierno por dentro. Como las cebollas: tenés capas.' },
  { id: 'woody', name: 'Woody', q: ['m', 'Toy Story', 1995], g: [ANI, COM, FAM], t: { l: 3, c: 2, m: 1 }, d: 'El que cuida al grupo y se preocupa de más. Tu lealtad no tiene fecha de vencimiento.' },
  { id: 'buzz', name: 'Buzz Lightyear', q: ['m', 'Toy Story', 1995], g: [ANI, COM, FAM], t: { v: 3, h: 1, l: 1 }, d: 'Optimismo a prueba de todo. Te tirás a cualquier misión: al infinito y más allá.' },
  { id: 'elsa', name: 'Elsa', q: ['m', 'Frozen', 2013], g: [ANI, FAM, FAN], t: { r: 2, c: 2, s: 1, m: 1 }, d: 'Un poder enorme que aprendiste a soltar. Cuando dejás de esconderte, brillás.' },
  { id: 'dory', name: 'Dory', q: ['m', 'Finding Nemo', 2003], g: [ANI, FAM, COM], t: { h: 3, c: 3 }, d: 'Optimismo contagioso y cero rencor. Seguís nadando, pase lo que pase.' },
  { id: 'ripley', name: 'Ellen Ripley', q: ['m', 'Alien', 1979], g: [TER, SCI], t: { v: 3, a: 2, l: 1 }, d: 'Sangre fría cuando todos entran en pánico. Si hay que sobrevivir, vos sabés cómo.' },
  { id: 'wick', name: 'John Wick', q: ['m', 'John Wick', 2014], g: [ACC, THR, CRI], t: { v: 3, l: 2, a: 1 }, d: 'Tranquilo… hasta que tocan lo que querés. Ahí no hay quién te pare.' },
  { id: 'neo', name: 'Neo', q: ['m', 'The Matrix', 1999], g: [ACC, SCI], t: { r: 3, v: 2, s: 1 }, d: 'Sentís que hay algo más allá de lo que te muestran, y no parás hasta descubrirlo.' },
  { id: 'doc', name: 'Doc Brown', q: ['m', 'Back to the Future', 1985], g: [AVE, COM, SCI], t: { s: 3, h: 2, r: 1 }, d: 'Genio despeinado y entusiasta. Tus ideas parecen locuras… hasta que funcionan.' },
  { id: 'marty', name: 'Marty McFly', q: ['m', 'Back to the Future', 1985], g: [AVE, COM, SCI], t: { r: 2, h: 2, v: 2 }, d: 'Te subís a cualquier aventura con onda, aunque odies que te digan "gallina".' },
  { id: 'forrest', name: 'Forrest Gump', q: ['m', 'Forrest Gump', 1994], g: [COM, DRA, ROM], t: { c: 3, l: 3 }, d: 'Corazón enorme y una forma simple de ver la vida que termina enseñándole a todos.' },
  { id: 'indy', name: 'Indiana Jones', q: ['m', 'Raiders of the Lost Ark', 1981], g: [AVE, ACC], t: { v: 3, a: 2, h: 2 }, d: 'Aventura, historia y cero planificación. Odiás las serpientes, pero amás un buen misterio.' },
  { id: 'dom', name: 'Dominic Toretto', q: ['m', 'The Fast and the Furious', 2001], g: [ACC, CRI, THR], t: { l: 3, v: 2 }, d: 'Familia ante todo. Si alguien es de los tuyos, lo es para siempre.' },
  { id: 'wednesday', name: 'Merlina Addams', q: ['t', 'Wednesday', 2022], g: [COM, MIS, TVS], t: { a: 3, r: 3 }, d: 'Sarcástica, brillante y sin interés en caerle bien a nadie. Tu honestidad brutal es arte.' },
];

// 10 preguntas de personalidad. p: puntos por rasgo.
export const PQ = [
  { q: 'Es sábado a la noche. ¿Qué hacés?', o: [['Salgo a la aventura, sin plan', { r: 2, v: 1, h: 1 }], ['Juntada tranqui con los de siempre', { l: 2, c: 1, h: 1 }], ['Me quedo leyendo o investigando algo', { s: 2, a: 1 }], ['Organizo algo grande que dé que hablar', { m: 2, h: 1 }]] },
  { q: 'Tu grupo tiene un problema serio. Vos…', o: [['Doy el primer paso sin dudar', { v: 3 }], ['Busco la jugada inteligente que nadie vio', { a: 2, s: 1 }], ['Me aseguro de que nadie quede atrás', { l: 2, c: 2 }], ['Tiro un chiste para bajar la tensión y después resuelvo', { h: 2, a: 1 }]] },
  { q: '¿Qué es lo que más te molesta?', o: [['Las injusticias', { v: 1, c: 2, l: 1 }], ['Las reglas sin sentido', { r: 3 }], ['La gente que no piensa', { s: 2, a: 1 }], ['Perder', { m: 3 }]] },
  { q: 'Elegí un superpoder', o: [['Volar', { r: 1, v: 1, h: 1 }], ['Leer mentes', { a: 2, s: 1 }], ['Curar a los demás', { c: 3 }], ['Controlar el tiempo', { m: 2, s: 1 }]] },
  { q: 'Tu mejor amigo te describiría como…', o: [['El que siempre está', { l: 3 }], ['El más divertido del grupo', { h: 3 }], ['El que tiene respuesta para todo', { s: 3 }], ['El que no le tiene miedo a nada', { v: 2, r: 1 }]] },
  { q: 'Encontrás un mapa a un tesoro', o: [['Voy ya, aunque sea peligroso', { v: 2, r: 1 }], ['Lo estudio y armo el plan perfecto', { a: 2, s: 1 }], ['Busco socios de confianza', { l: 2, c: 1 }], ['Lo vendo al mejor postor', { m: 2, a: 1 }]] },
  { q: '¿Qué rol tendrías en una película de atracos?', o: [['El cerebro del plan', { m: 2, a: 1 }], ['El que se infiltra con puro encanto', { h: 2, a: 1 }], ['El genio de la tecnología', { s: 3 }], ['El que cubre a todos cuando sale mal', { l: 2, v: 1 }]] },
  { q: 'Te ofrecen poder a cambio de traicionar a alguien', o: [['Jamás', { l: 3, c: 1 }], ['Acepto… y después los engaño a todos', { a: 3, r: 1 }], ['Lo enfrento ahí mismo', { v: 3 }], ['Mmm, dejame pensarlo', { m: 3 }]] },
  { q: '¿Qué frase te representa?', o: [['Lo importante es el viaje', { s: 1, r: 1, c: 1 }], ['Si lo hago, lo hago bien', { m: 2, s: 1 }], ['Mis amigos son mi familia', { l: 2, c: 1 }], ['La vida es muy corta para ser serio', { h: 3 }]] },
  { q: '¿Cómo manejás tus emociones?', o: [['Las muestro todas, sin filtro', { c: 2, h: 1 }], ['Me las guardo y sigo adelante', { v: 1, l: 1, a: 1 }], ['Las analizo hasta entenderlas', { s: 2 }], ['Las uso como combustible', { m: 2, r: 1 }]] },
];
