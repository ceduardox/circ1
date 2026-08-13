import { prisma } from './prisma.js';
import { hashPassword } from './auth.js';

// Usuarios "fake" que el admin usa para chatear como distintos nombres y países
// en la comunidad (cada uno con su bandera). Idempotente: solo crea los que no existan.
const fakeUsers = [
  { username: 'pablo', email: 'pablo@test.com', firstName: 'Pablo', lastName: 'Test', password: 'chat1234', country: 'Mexico' },
  { username: 'maria', email: 'maria@test.com', firstName: 'Maria', lastName: 'Test', password: 'chat1234', country: 'USA' },
  { username: 'carla', email: 'carla@test.com', firstName: 'Carla', lastName: 'Test', password: 'chat1234', country: 'Colombia' },
  { username: 'diego', email: 'diego@test.com', firstName: 'Diego', lastName: 'Test', password: 'chat1234', country: 'Argentina' },
  { username: 'elena', email: 'elena@test.com', firstName: 'Elena', lastName: 'Test', password: 'chat1234', country: 'Espana' },
  { username: 'luis', email: 'luis@test.com', firstName: 'Luis', lastName: 'Test', password: 'chat1234', country: 'Chile' },
  { username: 'nadia', email: 'nadia@test.com', firstName: 'Nadia', lastName: 'Test', password: 'chat1234', country: 'Peru' },
];

export async function syncFakeUsers(): Promise<number> {
  let created = 0;

  for (const u of fakeUsers) {
    const found = await prisma.user.findFirst({
      where: { OR: [{ username: u.username }, { email: u.email }] },
    });
    if (found) {
      // Corrige el país si falta (bandera en el chat) o el estado de membresía.
      const needsFix = !found.country || found.membershipStatus !== 'ACTIVE';
      if (needsFix) {
        await prisma.user.update({
          where: { id: found.id },
          data: { country: u.country, membershipStatus: 'ACTIVE' },
        });
      }
      continue;
    }
    const passwordHash = await hashPassword(u.password);
    await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: 'USER',
        membershipStatus: 'ACTIVE',
        country: u.country,
        referralPlans: ['estandar', 'elite'],
      },
    });
    created++;
  }

  return created;
}
