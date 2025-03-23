import * as SQLite from 'expo-sqlite';

import removeAccents from 'remove-accents';

export const createSlug = (name: string) => {
  return removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Abrir conexão com o banco
const db = SQLite.openDatabaseSync('astroData.db');

export interface Astro {
	id: number;
	name: string;
	slug: string;
	type: string;
	magnitude: string;
	distance: string;
	facts: string;
	icon: string;
	size: string;
	moons?: string;
}

export const getAstroType = async (name: string): Promise<string> => {
	const result = await db.getFirstAsync<{ type: string }>(`
		SELECT type FROM astros WHERE name = ?;
	`, [name]);
	return result?.type ?? '';
}

// Função para criar tabela
export const createTables = async () => {
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS astros (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			slug TEXT NOT NULL UNIQUE,
			type TEXT NOT NULL,
			magnitude TEXT NOT NULL,
			distance TEXT NOT NULL,
			facts TEXT NOT NULL,
			icon TEXT NOT NULL,
			size TEXT NOT NULL,
			moons TEXT
		);
 	`);
};
	
// Função para buscar todos os astros
export const getAstros = async (): Promise<Astro[]> => {
	const all = await db.getAllAsync<Astro[]>(`
	SELECT 
		id,
		name,
		slug,
		type,
		magnitude,
		distance,
		facts,
		icon,
		size,
		moons
	FROM astros
	ORDER BY name ASC;
`);
	return all.flat() ?? [];
};

export const getAstroBySlug = async (slug: string): Promise<Astro | null> => {
	const result = await db.getFirstAsync<Astro>(`
	  SELECT * FROM astros WHERE slug = ?;
	`, [slug]);
	
	return result;
};
	
// Função auxiliar para inserir dados iniciais
export const seedDatabase = async (db: SQLite.SQLiteDatabase) => {
	try{
		await db.runAsync('DELETE FROM astros;'); // Limpa tabela
		
		const mercury: Omit<Astro, 'id'> = {
			name: 'Mercúrio',
			slug: createSlug('Mercúrio'),
			type: 'Planeta',
			magnitude: '-2.6 a 5.7',
			distance: '77 milhões km',
			size: '4.880 km de diâmetro e 1/3 do tamanho da Terra',
			facts: JSON.stringify([
				'O menor planeta do Sistema Solar',
				'Temperatura varia de -180°C a 430°C',
				'O ano dura 88 dias terrestres',
			]),
			icon: 'mercury.png'
		};
		
		await db.runAsync(
			`INSERT INTO astros (name, slug,  type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[mercury.name, mercury.slug, mercury.type, mercury.magnitude, mercury.distance, mercury.size,
				mercury.facts, mercury.icon]
		);

		const venus: Omit<Astro, 'id'> = {
			name: 'Vênus',
			slug: createSlug('Vênus'),
			type: 'Planeta',
			magnitude: '-4.6 a -3.8',
			distance: '261 milhões km',
			size: '12.104 km de diâmetro e 95% do tamanho da Terra',
			facts: JSON.stringify([
				'O planeta mais brilhante do Sistema Solar',
				'Temperatura de 460°C',
				'O dia dura 243 dias terrestres',
			]),
			icon: 'venus.png'
		};

		await db.runAsync(
			`INSERT INTO astros (name, slug, type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[venus.name, venus.slug, venus.type, venus.magnitude, venus.distance, venus.size,
				venus.facts, venus.icon]
		);

		const mars: Omit<Astro, 'id'> = {
			name: 'Marte',
			slug: createSlug('Marte'),
			type: 'Planeta',
			magnitude: '-2.9 a 1.8',
			distance: '225 milhões km',
			size: '6.779 km de diâmetro e 1/2 do tamanho da Terra',
			moons: '2',
			facts: JSON.stringify([
				'O planeta vermelho',
				'Temperatura varia de -140°C a 20°C',
				'O dia dura ≈ um dia terrestre',
			]),
			icon: 'mars.png'
		};

		await db.runAsync(
			`INSERT INTO astros (name, slug, type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[mars.name, mars.slug, mars.type, mars.magnitude, mars.distance, mars.size,
				mars.facts, mars.icon]
		);

		const jupiter: Omit<Astro, 'id'> = {
			name: 'Júpiter',
			slug: createSlug('Júpiter'),
			type: 'Planeta',
			magnitude: '-1.6 a -2.9',
			distance: '588 milhões km',
			size: '139.822 km de diâmetro e 11 vezes o tamanho da Terra',
			moons: '79',
			facts: JSON.stringify([
				'O maior planeta do Sistema Solar',
				'Temperatura de -150°C',
				'O dia dura 9h e 56min',
			]),
			icon: 'jupiter.png'
		};

		await db.runAsync(
			`INSERT INTO astros (name, slug, type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[jupiter.name, jupiter.slug, jupiter.type, jupiter.magnitude, jupiter.distance, jupiter.size,
				jupiter.facts, jupiter.icon]
		);

		const saturn: Omit<Astro, 'id'> = {
			name: 'Saturno',
			slug: createSlug('Saturno'),
			type: 'Planeta',
			magnitude: '0.5 a 1.2',
			distance: '1.2 bilhões km',
			size: '116.464 km de diâmetro e 9 vezes o tamanho da Terra',
			moons: '82',
			facts: JSON.stringify([
				'O planeta com anéis',
				'Temperatura de -180°C',
				'O dia dura 10h e 42min',
			]),
			icon: 'saturn.png'
		};

		await db.runAsync(
			`INSERT INTO astros (name, slug, type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[saturn.name, saturn.slug, saturn.type, saturn.magnitude, saturn.distance, saturn.size,
				saturn.facts, saturn.icon]
		);

		const moon: Omit<Astro, 'id'> = {
			name: 'Lua',
			slug: createSlug('Lua'),
			type: 'Satélite',
			magnitude: '-12.7 a -2.5',
			distance: '384.400 km',
			size: '3.474 km de diâmetro e 1/4 do tamanho da Terra',
			facts: JSON.stringify([
				'O único satélite natural da Terra',
				'Temperatura varia de -173°C a 127°C',
				'O dia dura 27 dias terrestres',
			]),
			icon: 'moon.png'
		};

		await db.runAsync(
			`INSERT INTO astros (name, slug, type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[moon.name, moon.slug, moon.type, moon.magnitude, moon.distance, moon.size,
				moon.facts, moon.icon]
		);

		const sun: Omit<Astro, 'id'> = {
			name: 'Sol',
			slug: createSlug('Sol'),
			type: 'Estrela',
			magnitude: '-26.7',
			distance: '149.6 milhões km',
			size: '1.392.684 km de diâmetro e 109 vezes o tamanho da Terra',
			facts: JSON.stringify([
				'O centro do Sistema Solar',
				'Temperatura de 5.500°C',
			]),
			icon: 'sun.png'
		};

		await db.runAsync(
			`INSERT INTO astros (name, slug, type, magnitude, distance, size, facts, icon)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
			[sun.name, sun.slug, sun.type, sun.magnitude, sun.distance, sun.size,
				sun.facts, sun.icon]
		);
	
	} catch (error) {
		console.error("Erro ao popular dados:", error);
		throw error;
	}
};
	
// Inicialização do banco (executar no app startup)
export const initDatabase = async () => {
	const db = SQLite.openDatabaseSync('astroData.db');
  
	try {
	  // Inicia uma transação manualmente
	  await db.execAsync('BEGIN TRANSACTION;');
  
	  // 1. Deleta a tabela se existir
	  await db.execAsync('DROP TABLE IF EXISTS astros;');
  
	  // 2. Cria a tabela
	  await db.execAsync(`
		CREATE TABLE IF NOT EXISTS astros (
		  id INTEGER PRIMARY KEY AUTOINCREMENT,
		  name TEXT NOT NULL UNIQUE,
		  slug TEXT NOT NULL UNIQUE,
		  type TEXT NOT NULL,
		  magnitude TEXT NOT NULL,
		  distance TEXT NOT NULL,
		  facts TEXT NOT NULL,
		  icon TEXT NOT NULL,
		  size TEXT NOT NULL,
		  moons TEXT
		);
	  `);
  
	  // 3. Popula os dados
	  await seedDatabase(db);
  
	  // Finaliza a transação
	  await db.execAsync('COMMIT;');
	  console.log('Banco inicializado com sucesso!');
  
	} catch (error) {
	  // Desfaz em caso de erro
	  await db.execAsync('ROLLBACK;');
	  console.error("Erro durante a transação:", error);
	  throw error;
	}
  };