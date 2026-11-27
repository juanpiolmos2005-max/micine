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
      H: { name: 'Hufflepuff', c1: '#c9a227', c2: '#2b2522', sym: 'H', d: 'Leal, trabajador y justo. Sos el amigo con el que todos pueden contar, sin pedir nada a cambio.' },
      R: { name: 'Ravenclaw', c1: '#0e1a40', c2: '#946b2d', sym: 'R', d: 'Curioso, creativo e ingenioso. Te mueve aprender y ver el mundo de una forma distinta.' },
      S: { name: 'Slytherin', c1: '#1a472a', c2: '#9aa0a6', sym: 'S', d: 'Ambicioso, astuto y decidido. Sabés lo que querés y encontrás la forma de conseguirlo.' },
    },
    qs: [
      { q: '¿Qué valorás más en un amigo?', o: [['Que se anime a todo', { G: 2 }], ['Que sea leal siempre', { H: 2 }], ['Que sea inteligente', { R: 2 }], ['Que sepa lo que quiere', { S: 2 }]] },
      { q: 'Mañana tenés un examen difícil', o: [['Improviso, algo va a salir', { G: 2 }], ['Estudio toda la noche con mi grupo', { H: 2 }], ['Ya lo estudié hace una semana', { R: 2 }], ['Averiguo qué va a tomar el profesor', { S: 2 }]] },
      { q: 'Encontrás una puerta prohibida en el castillo', o: [['La abro ya', { G: 2 }], ['Aviso para que nadie se lastime', { H: 2 }], ['Investigo qué esconde antes de abrirla', { R: 2 }], ['Me fijo cómo me conviene usarla', { S: 2 }]] },
      { q: '¿Qué materia elegís?', o: [['Defensa contra las Artes Oscuras', { G: 2 }], ['Herbología', { H: 2 }], ['Encantamientos', { R: 2 }], ['Pociones', { S: 2 }]] },
      { q: '¿Qué mascota te llevarías al colegio?', o: [['Un búho valiente que vuela de noche', { G: 1, R: 1 }], ['Un sapo tranquilo y fiel', { H: 2 }], ['Un gato muy observador', { R: 2 }], ['Una serpiente, obvio', { S: 2 }]] },
      { q: '¿Cuál sería tu mayor miedo?', o: [['Ser cobarde', { G: 2 }], ['Quedarme solo', { H: 2 }], ['No entender algo', { R: 2 }], ['Ser alguien del montón', { S: 2 }]] },
      { q: 'Elegí entre…', o: [['Gloria por una hazaña', { G: 2 }], ['Amigos para toda la vida', { H: 2 }], ['Todo el conocimiento del mundo', { R: 2 }], ['Poder e influencia', { S: 2 }]] },
      { q: 'Elegí un color', o: [['Rojo', { G: 1 }], ['Amarillo', { H: 1 }], ['Azul', { R: 1 }], ['Verde', { S: 1 }]] },
    ],
  },
  {
    id: 'hotd', name: '¿Sos de los verdes o de los negros?', short: 'Verdes o negros', unlock: { tv: 94997 }, lock: 'House of the Dragon',
    out: {
      V: { name: 'Los verdes', c1: '#1f5f3a', c2: '#0b2416', sym: 'V', d: 'Creés en la tradición, el orden y en hacer lo necesario para mantener el reino en pie, aunque cueste.' },
      N: { name: 'Los negros', c1: '#151515', c2: '#9b111e', sym: 'N', d: 'Para vos la palabra dada es sagrada. Defendés a quien fue elegido, aunque el mundo entero diga lo contrario.' },
    },
    qs: [
      { q: '¿Quién debería heredar el trono?', o: [['El hijo mayor, como siempre fue', { V: 2 }], ['La persona que el rey eligió y nombró', { N: 2 }]] },
      { q: '¿Qué pesa más?', o: [['La estabilidad del reino', { V: 2 }], ['La palabra dada', { N: 2 }]] },
      { q: 'Elegí tu dragón', o: [['El más grande y temido de todos', { V: 2 }], ['Uno veloz, joven y leal', { N: 2 }]] },
      { q: 'Si alguien te traiciona…', o: [['Respondo con fuerza para que no se repita', { V: 2 }], ['Busco aliados antes de mover una pieza', { N: 2 }]] },
      { q: 'Tu lugar ideal', o: [['La capital, en el centro del poder', { V: 2 }], ['Una fortaleza en una isla, lejos de las intrigas', { N: 2 }]] },
      { q: '¿Qué preferís?', o: [['Orden y reglas claras', { V: 2 }], ['Libertad para elegir tu camino', { N: 2 }]] },
      { q: 'El consejo de guerra está dividido', o: [['Golpear primero', { V: 2 }], ['Negociar y esperar el momento', { N: 2 }]] },
    ],
  },
  {
    id: 'got', name: '¿A qué casa de Poniente pertenecés?', short: 'Casa de Poniente', unlock: { tv: 1399 }, lock: 'Game of Thrones',
    out: {
      K: { name: 'Stark', c1: '#5b6770', c2: '#1d2329', sym: 'K', d: 'Honor, familia y palabra. Sos firme como el norte: no traicionás a nadie y nadie te dobla.' },
      L: { name: 'Lannister', c1: '#8b0000', c2: '#c9a227', sym: 'L', d: 'Astuto, orgulloso y estratégico. Sabés que en el juego de poder, la inteligencia vale más que la fuerza.' },
      T: { name: 'Targaryen', c1: '#141414', c2: '#b3001b', sym: 'T', d: 'Fuego y destino. Tenés una visión grande y la intensidad para hacerla realidad.' },
      Y: { name: 'Tyrell', c1: '#2e6b2f', c2: '#d4a017', sym: 'Y', d: 'Encanto, elegancia y diplomacia. Ganás tus batallas con una sonrisa y en la mesa justa.' },
    },
    qs: [
      { q: '¿Qué te define?', o: [['El honor', { K: 2 }], ['La inteligencia y los recursos', { L: 2 }], ['El destino', { T: 2 }], ['El encanto', { Y: 2 }]] },
      { q: 'Tu clima ideal', o: [['Frío y nieve', { K: 2 }], ['Una ciudad dorada junto al mar', { L: 2 }], ['El calor del desierto', { T: 2 }], ['Jardines llenos de flores', { Y: 2 }]] },
      { q: 'Para ganar una guerra necesitás…', o: [['La lealtad de tu gente', { K: 2 }], ['Oro y alianzas', { L: 2 }], ['Fuego', { T: 2 }], ['Comida y diplomacia', { Y: 2 }]] },
      { q: 'Tu familia es…', o: [['Lo más importante, siempre', { K: 2 }], ['Un apellido que hay que hacer respetar', { L: 2 }], ['Un legado que hay que recuperar', { T: 2 }], ['La red que te sostiene en la corte', { Y: 2 }]] },
      { q: 'Alguien te insulta en un banquete', o: [['Lo enfrento de frente', { K: 2 }], ['Sonrío y espero mi momento', { L: 2 }], ['Lo pongo en su lugar delante de todos', { T: 2 }], ['Lo dejo en ridículo con elegancia', { Y: 2 }]] },
      { q: '¿Qué símbolo elegís?', o: [['Un lobo', { K: 2 }], ['Un león', { L: 2 }], ['Un dragón', { T: 2 }], ['Una rosa', { Y: 2 }]] },
      { q: 'Elegí una frase', o: [['La palabra es ley', { K: 2 }], ['Todo tiene un precio', { L: 2 }], ['Nací para reinar', { T: 2 }], ['La belleza también es poder', { Y: 2 }]] },
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
      { q: '¿De dónde sale tu fuerza?', o: [['De la calma', { J: 2 }], ['De la pasión', { S: 2 }], ['De la confianza en mí mismo', { C: 2 }]] },
      { q: 'Ante una injusticia…', o: [['Ayudo aunque no gane nada', { J: 2 }], ['Uso el caos a mi favor', { S: 2 }], ['Ayudo… y si hay recompensa, mejor', { C: 2 }]] },
      { q: 'Elegí tu arma', o: [['Un sable de luz azul', { J: 2 }], ['Un sable de luz rojo', { S: 2 }], ['Un bláster y buena puntería', { C: 2 }]] },
      { q: 'Las reglas son…', o: [['Una guía', { J: 2 }], ['Para los débiles', { S: 2 }], ['Sugerencias', { C: 2 }]] },
      { q: 'Tu nave ideal', o: [['Un caza ágil y sencillo', { J: 2 }], ['Un destructor imponente', { S: 2 }], ['Un carguero viejo pero el más rápido', { C: 2 }]] },
      { q: 'El miedo es…', o: [['Algo a superar', { J: 2 }], ['Una herramienta', { S: 2 }], ['Algo que disimulo con un chiste', { C: 2 }]] },
      { q: 'Tu equipo ideal', o: [['Un maestro y un aprendiz', { J: 2 }], ['Un imperio que me obedezca', { S: 2 }], ['Un copiloto peludo y fiel', { C: 2 }]] },
    ],
  },
];
