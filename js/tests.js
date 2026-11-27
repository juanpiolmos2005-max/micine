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

// Duplas para el test en pareja.
export const DUOS = [
  { id: 'shrekfiona', names: 'Shrek y Fiona', q: ['m', 'Shrek', 2001], g: [ANI, COM, ROM, FAN], t: { h: 2, c: 3, r: 3, v: 1 }, d: 'Nada de cuento de hadas tradicional: se eligen tal cual son, con capas y todo.' },
  { id: 'hanleia', names: 'Han Solo y Leia', q: ['m', 'Star Wars', 1977], g: [SCI, AVE, ROM], t: { v: 3, r: 3, h: 2, m: 1 }, d: 'Se pelean, se buscan y se salvan mutuamente. Química pura entre dos tercos.' },
  { id: 'ronhermione', names: 'Ron y Hermione', q: ['m', "Harry Potter and the Philosopher's Stone", 2001], g: [FAN, FAM, ROM], t: { h: 3, s: 3, l: 3 }, d: 'Uno pone el humor, el otro la cabeza. Discuten por todo… y no pueden estar separados.' },
  { id: 'frodosam', names: 'Frodo y Sam', q: ['m', 'The Lord of the Rings: The Fellowship of the Ring', 2001], g: [FAN, AVE], t: { l: 3, c: 3, v: 2 }, d: 'Compañeros de viaje hasta el final: si uno cae, el otro lo levanta.' },
  { id: 'woodybuzz', names: 'Woody y Buzz', q: ['m', 'Toy Story', 1995], g: [ANI, FAM, COM], t: { l: 3, v: 2, h: 2, c: 1 }, d: 'Empezaron compitiendo y terminaron inseparables. Opuestos que se complementan.' },
  { id: 'martydoc', names: 'Marty y Doc', q: ['m', 'Back to the Future', 1985], g: [SCI, AVE, COM], t: { s: 3, r: 2, h: 3 }, d: 'Uno tiene las ideas locas, el otro se anima a probarlas. Aventura asegurada.' },
  { id: 'sherlockwatson', names: 'Sherlock y Watson', q: ['t', 'Sherlock', 2010], g: [CRI, MIS, DRA], t: { a: 3, s: 2, l: 2, c: 1 }, d: 'Uno deduce, el otro lo mantiene con los pies en la tierra. Juntos resuelven cualquier misterio.' },
  { id: 'jackrose', names: 'Jack y Rose', q: ['m', 'Titanic', 1997], g: [ROM, DRA], t: { c: 3, r: 3, v: 1 }, d: 'Amor intenso, de esos que rompen las reglas. (Y sí, había lugar en la puerta.)' },
  { id: 'monicachandler', names: 'Monica y Chandler', q: ['t', 'Friends', 1994], g: [COM, ROM], t: { h: 3, c: 2, m: 2, l: 1 }, d: 'Una ordena el mundo, el otro lo hace reír. La pareja que nadie vio venir y salió perfecta.' },
  { id: 'jimpam', names: 'Jim y Pam', q: ['t', 'The Office', 2005], g: [COM, ROM], t: { h: 3, c: 3 }, d: 'Complicidad de miradas, bromas compartidas y mucha ternura.' },
  { id: 'carlellie', names: 'Carl y Ellie', q: ['m', 'Up', 2009], g: [ANI, FAM, AVE], t: { c: 3, l: 3, v: 1 }, d: 'Una vida entera de aventuras, grandes y chiquitas. Amor que dura para siempre.' },
  { id: 'gomezmorticia', names: 'Homero y Morticia', q: ['m', 'The Addams Family', 1991], g: [COM, FAM, FAN], t: { c: 3, r: 3, h: 2 }, d: 'Raros para el resto, perfectos entre ustedes. Pasión sin vergüenza.' },
  { id: 'thelmalouise', names: 'Thelma y Louise', q: ['m', 'Thelma & Louise', 1991], g: [DRA, CRI, AVE], t: { r: 3, l: 3, v: 2 }, d: 'Compañeras de ruta hasta las últimas consecuencias. Libertad ante todo.' },
  { id: 'miaseb', names: 'Mia y Sebastian', q: ['m', 'La La Land', 2016], g: [ROM, DRA, COM], t: { m: 3, c: 3, s: 1 }, d: 'Dos soñadores que se impulsan a ser su mejor versión.' },
  { id: 'walterjesse', names: 'Walter y Jesse', q: ['t', 'Breaking Bad', 2008], g: [DRA, CRI], t: { a: 3, m: 3, r: 2 }, d: 'Un dúo explosivo: cerebro y calle. Juntos son imparables (para bien o para mal).' },
  { id: 'timonpumba', names: 'Timón y Pumba', q: ['m', 'The Lion King', 1994], g: [ANI, FAM, COM], t: { h: 3, c: 2, l: 2 }, d: 'Sin preocupaciones. Lo de ustedes es disfrutar y cuidarse mutuamente.' },
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

// Tests por saga: aparecen al marcar como vista esa saga o serie.
export const STESTS = [
  {
    id: 'hp', name: '¿A qué casa de Hogwarts pertenecés?', short: 'Casa de Hogwarts', unlock: { saga: 'hp' }, lock: 'cualquier película de Harry Potter',
    out: {
      G: { name: 'Gryffindor', c1: '#7f0909', c2: '#d4a017', sym: 'G', d: 'Valiente, impulsivo y de gran corazón. Te animás cuando otros dudan y defendés a los tuyos con todo.' },
      H: { name: 'Hufflepuff', c1: '#c9a227', c2: '#2b2522', sym: 'H', d: 'Leal, trabajador y justo. Sos la persona con la que todos pueden contar, sin pedir nada a cambio.' },
      R: { name: 'Ravenclaw', c1: '#0e1a40', c2: '#946b2d', sym: 'R', d: 'Curioso, creativo e ingenioso. Te mueve aprender y ver el mundo de una forma distinta.' },
      S: { name: 'Slytherin', c1: '#1a472a', c2: '#9aa0a6', sym: 'S', d: 'Ambicioso, astuto y decidido. Sabés lo que querés y encontrás la forma de conseguirlo.' },
    },
    qs: [
      { q: 'Un compañero se copió en un examen importante y te pide que no digas nada.', o: [['Lo encaro y le digo que lo arregle él', { G: 2, H: 1 }], ['Me callo: no soy quién para juzgar', { H: 2 }], ['Me intriga cómo lo hizo sin que lo descubrieran', { R: 2, S: 1 }], ['Me guardo el dato, puede servirme después', { S: 2 }]] },
      { q: 'Llegás a una ciudad nueva donde no conocés a nadie. Lo primero que hacés es…', o: [['Salir a recorrer sin mapa', { G: 2, R: 1 }], ['Buscar un grupo o algún lugar donde dar una mano', { H: 2 }], ['Ir a museos, librerías y lugares con historia', { R: 2 }], ['Averiguar quién es quién y dónde se mueve todo', { S: 2 }]] },
      { q: 'En un trabajo en grupo, casi siempre terminás siendo…', o: [['El que defiende la idea más arriesgada', { G: 2 }], ['El que hace que nadie quede afuera', { H: 2 }], ['El que encuentra la solución que nadie pensó', { R: 2 }], ['El que se lleva el crédito… porque lo merece', { S: 2, G: 1 }]] },
      { q: 'Te regalan una tarde libre, sin ninguna obligación.', o: [['Algo que me dé adrenalina', { G: 2 }], ['Cocinar o hacer algo con mis amigos', { H: 2 }], ['Aprender algo nuevo por mi cuenta', { R: 2 }], ['Avanzar en mis planes a futuro', { S: 2, R: 1 }]] },
      { q: '¿Qué te dolería más que dijeran de vos?', o: [['Que no te la jugás por nada', { G: 2 }], ['Que sos egoísta', { H: 2 }], ['Que no entendés las cosas', { R: 2 }], ['Que sos alguien del montón', { S: 2 }]] },
      { q: 'Hay una regla injusta en el lugar donde estudiás o trabajás.', o: [['La rompo a propósito para que se note', { G: 2, S: 1 }], ['Junto a los demás para pedir que la cambien', { H: 2, G: 1 }], ['Armo un argumento impecable para que la cambien', { R: 2 }], ['Busco la forma de que no se aplique a mí', { S: 2 }]] },
      { q: 'Un desconocido te ofrece un objeto misterioso que da mucho poder.', o: [['Lo acepto y veo qué pasa', { G: 1, S: 1 }], ['No lo acepto: algo no me cierra', { H: 2 }], ['Primero pregunto todo sobre su origen', { R: 2 }], ['Lo acepto solo si sé que lo puedo controlar', { S: 2 }]] },
      { q: '¿Con qué frase te identificás más?', o: [['Prefiero arrepentirme de lo que hice', { G: 2 }], ['Juntos llegamos más lejos', { H: 2 }], ['Siempre hay algo más para entender', { R: 2 }], ['Nadie me va a regalar nada', { S: 2 }]] },
    ],
  },
  {
    id: 'hotd', name: '¿Sos de los verdes o de los negros?', short: 'Verdes o negros', unlock: { tv: 94997 }, lock: 'House of the Dragon',
    out: {
      V: { name: 'Los verdes', c1: '#1f5f3a', c2: '#0b2416', sym: 'V', d: 'Creés en la tradición, el orden y en hacer lo necesario para mantener todo en pie, aunque cueste.' },
      N: { name: 'Los negros', c1: '#151515', c2: '#9b111e', sym: 'N', d: 'Para vos la palabra dada es sagrada. Defendés lo que es justo, aunque el mundo entero diga lo contrario.' },
    },
    qs: [
      { q: 'En una familia, el hermano mayor es un desastre y la hermana menor es brillante. ¿Quién debería quedar a cargo del negocio familiar?', o: [['El mayor: las costumbres existen por algo', { V: 2 }], ['La más capaz, aunque rompa la costumbre', { N: 2 }], ['El que tenga más apoyo del resto', { V: 1, N: 1 }]] },
      { q: 'Un amigo de toda la vida te pide que lo defiendas en algo que no está del todo bien.', o: [['Lo defiendo: la lealtad va primero', { N: 2 }], ['Le digo que no; hay cosas que importan más', { V: 2 }], ['Lo ayudo a arreglarlo sin que nadie se entere', { V: 1, N: 1 }]] },
      { q: '¿Qué tipo de líder preferís?', o: [['Uno respetado por todos, aunque sea duro', { V: 2 }], ['Uno querido, aunque genere polémica', { N: 2 }]] },
      { q: 'Te enterás de un secreto que puede cambiar quién manda.', o: [['Lo uso enseguida, antes que otro', { V: 2 }], ['Se lo cuento a quien corresponde', { N: 2 }], ['Lo guardo hasta el momento justo', { V: 1, N: 1 }]] },
      { q: 'Hay una pelea familiar fuerte. Vos…', o: [['Pongo calma, aunque alguien salga perdiendo', { V: 2 }], ['Me pongo del lado de quien creo que tiene razón, cueste lo que cueste', { N: 2 }]] },
      { q: 'Una promesa vieja ya no le conviene a nadie.', o: [['Se cumple igual: una promesa es una promesa', { N: 2 }], ['Se revisa: los tiempos cambian', { V: 2 }]] },
      { q: '¿Qué te mueve más?', o: [['Cuidar lo que construyeron los que vinieron antes', { V: 2 }], ['Que se haga justicia con los míos', { N: 2 }], ['Que mi familia salga adelante, como sea', { V: 1, N: 1 }]] },
    ],
  },
  {
    id: 'got', name: '¿A qué casa de Poniente pertenecés?', short: 'Casa de Poniente', unlock: { tv: 1399 }, lock: 'Game of Thrones',
    out: {
      K: { name: 'Stark', c1: '#5b6770', c2: '#1d2329', sym: 'K', d: 'Honor, familia y palabra. Sos firme: no traicionás a nadie y nadie te dobla.' },
      L: { name: 'Lannister', c1: '#8b0000', c2: '#c9a227', sym: 'L', d: 'Astuto, orgulloso y estratégico. Sabés que en el juego del poder la inteligencia vale más que la fuerza.' },
      T: { name: 'Targaryen', c1: '#141414', c2: '#b3001b', sym: 'T', d: 'Intensidad y destino. Tenés una visión grande y la pasión para hacerla realidad.' },
      Y: { name: 'Tyrell', c1: '#2e6b2f', c2: '#d4a017', sym: 'Y', d: 'Encanto, elegancia y diplomacia. Ganás tus batallas con una sonrisa y en la mesa justa.' },
    },
    qs: [
      { q: 'Alguien de tu familia cometió un error grave.', o: [['Lo enfrento y que asuma las consecuencias', { K: 2 }], ['Lo tapo: el apellido no se mancha', { L: 2 }], ['Lo perdono si me demuestra que está de mi lado', { T: 2 }], ['Lo arreglo hablando con las personas correctas', { Y: 2, L: 1 }]] },
      { q: '¿Cómo te gusta ganar una discusión?', o: [['Con la verdad, sin vueltas', { K: 2 }], ['Con paciencia, esperando que el otro se equivoque', { L: 2 }], ['Con convicción, que se note que tengo razón', { T: 2 }], ['Haciendo que el otro crea que fue su idea', { Y: 2 }]] },
      { q: 'Te ofrecen un puesto importante muy lejos de tu casa.', o: [['Lo rechazo: mi lugar es con los míos', { K: 2 }], ['Lo acepto si me da poder real', { L: 2, T: 1 }], ['Lo acepto si es parte de un propósito más grande', { T: 2 }], ['Lo acepto y hago contactos en todos lados', { Y: 2 }]] },
      { q: '¿Cuál es tu peor defecto?', o: [['Soy demasiado rígido con lo que está bien', { K: 2 }], ['Puedo ser frío y calculador', { L: 2 }], ['Me cuesta controlar el enojo', { T: 2 }], ['A veces digo lo que el otro quiere escuchar', { Y: 2 }]] },
      { q: '¿Qué regalo te gustaría recibir?', o: [['Algo hecho a mano por alguien que quiero', { K: 2 }], ['Algo caro y exclusivo', { L: 2 }], ['Algo antiguo, con historia', { T: 2 }], ['Una invitación a un evento importante', { Y: 2 }]] },
      { q: 'En una crisis, la gente espera que vos…', o: [['Pongas el cuerpo', { K: 2, T: 1 }], ['Tengas el plan y los recursos', { L: 2 }], ['Tomes la decisión más audaz', { T: 2 }], ['Mantengas a todos unidos y tranquilos', { Y: 2, K: 1 }]] },
      { q: '¿Con qué frase te identificás más?', o: [['La palabra es ley', { K: 2 }], ['Todo tiene un precio', { L: 2 }], ['Nací para algo grande', { T: 2 }], ['La amabilidad también es poder', { Y: 2 }]] },
    ],
  },
  {
    id: 'sw', name: '¿Jedi, Sith o contrabandista?', short: 'Jedi, Sith o contrabandista', unlock: { saga: 'sw' }, lock: 'cualquier película de Star Wars',
    out: {
      J: { name: 'Jedi', c1: '#1d4e89', c2: '#0b1830', sym: 'J', d: 'Calma, disciplina y compasión. Usás tu fuerza para proteger a los demás, nunca para dominarlos.' },
      S: { name: 'Sith', c1: '#7a0010', c2: '#0a0a0a', sym: 'S', d: 'Pasión, ambición y poder. Para vos el miedo es una herramienta y las reglas, un estorbo.' },
      C: { name: 'Contrabandista', c1: '#8a5a2b', c2: '#1f1a14', sym: 'C', d: 'Ni de un bando ni del otro: libre, canchero y con suerte. Pero cuando importa, siempre volvés.' },
    },
    qs: [
      { q: 'Alguien te hace enojar mucho.', o: [['Respiro y dejo que se me pase', { J: 2 }], ['Uso ese enojo para ganarle', { S: 2 }], ['Tiro un chiste y sigo con lo mío', { C: 2 }]] },
      { q: 'Encontrás una billetera con mucha plata adentro.', o: [['La devuelvo entera', { J: 2 }], ['Me la quedo: el que la perdió, la perdió', { S: 2 }], ['La devuelvo… y acepto la recompensa', { C: 2, J: 1 }]] },
      { q: '¿Cómo aprendés mejor?', o: [['Con un buen maestro y paciencia', { J: 2 }], ['Superando al que es mejor que yo', { S: 2 }], ['Probando y equivocándome sobre la marcha', { C: 2 }]] },
      { q: 'Para vos, las reglas son…', o: [['Una guía útil', { J: 2 }], ['Algo para los que no tienen poder', { S: 2 }], ['Sugerencias', { C: 2 }]] },
      { q: 'Te ofrecen el doble de sueldo en un lugar con un jefe cruel.', o: [['No: la plata no lo es todo', { J: 2 }], ['Sí, y algún día me quedo con su lugar', { S: 2 }], ['Negocio bien y me voy cuando me convenga', { C: 2 }]] },
      { q: 'El miedo es…', o: [['Algo para entender y soltar', { J: 2 }], ['Una herramienta', { S: 2 }], ['Algo que se disimula con estilo', { C: 2 }]] },
      { q: '¿Cómo ayudás a un amigo en problemas?', o: [['Lo escucho y lo aconsejo', { J: 2 }], ['Le enseño a ser más fuerte que los demás', { S: 2 }], ['Aparezco a último momento, cuando ya nadie me esperaba', { C: 2, J: 1 }]] },
    ],
  },
];
