import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const IMG = '/images/vip-pro/';

const vipModules = [
  {
    slug: 'estrategia-muestras',
    title: 'Muestras vs Publicidad',
    subtitle: 'Por qué invertir en muestras gana más que ads',
    icon: 'Rocket',
    image: `${IMG}muestras.jpg`,
    description:
      'Esto es lo que hace la diferencia. En vez de quemar dinero en publicidad pagada, inviertes en muestras para afiliados. Algunos afiliados harán videos que no venden. Pero uno solo que enganche ventas recurrentes paga las muestras mil veces.',
    steps: [
      'Elige 1 producto de ryztor.com que se venda solo',
      'Selecciona 5-10 afiliados de TikTok con audiencia parecida a la tuya',
      'Manda la muestra con instrucciones simples (sin guion rígido)',
      'Repite con los afiliados que traigan ventas recurrentes',
      'Escala: cada video que vende justifica más muestras',
    ],
    links: [
      { label: 'Catálogo ryztor.com', url: 'https://ryztor.com' },
    ],
    statNumber: '$1',
    statLabel: 'muestra puede volverse cientos de ventas',
    orderIndex: 1,
  },
  {
    slug: 'vende-sin-llc',
    title: 'Vende sin LLC ni ITIN',
    subtitle: 'El puente que conecta tus productos con afiliados de TikTok Shop',
    icon: 'Zap',
    image: `${IMG}redes.jpg`,
    description:
      'TikTok Shop pide LLC o ITIN propios para vender directo. Pero no los necesitas: las empresas puente ya tienen la estructura en USA y conectan tus productos de ryztor.com con afiliados de TikTok Shop. Tú compartes los videos y enlaces; la empresa puente se encarga del resto y tú ganas por cada venta.',
    steps: [
      'Elige una empresa puente que opere con afiliados de TikTok Shop en USA',
      'Registra tu cuenta en su plataforma (sin necesidad de LLC/ITIN propios)',
      'Conecta los productos de ryztor.com a sus afiliados de TikTok Shop',
      'Comparte los videos y enlaces de venta en tu propia red',
      'Cobra tu comisión por cada venta que generen tus enlaces',
    ],
    links: [
      { label: 'TikTok Shop Affiliate', url: 'https://seller-us.tiktok.com' },
      { label: 'ShopMy', url: 'https://www.shopmy.us' },
      { label: 'Billo', url: 'https://billo.app' },
      { label: 'LTK', url: 'https://www.liketoknow.it' },
      { label: 'Impact / ShareASale', url: 'https://impact.com' },
    ],
    checkItems: [
      'Me registré en TikTok Shop Affiliate',
      'Me registré en ShopMy',
      'Me registré en Billo',
      'Me registré en LTK',
      'Me registré en Impact / ShareASale',
    ],
    statNumber: '0',
    statLabel: 'LLC ni ITIN necesarios para empezar',
    orderIndex: 2,
  },
  {
    slug: 'como-funciona-tiktok',
    title: 'Cómo funciona TikTok Shop',
    subtitle: 'Ventas, tiempos de pago y entregas explicados',
    icon: 'ShoppingBag',
    image: `${IMG}hero-tiktok.jpg`,
    description:
      'Así fluye todo cuando un afiliado vende un producto tuyo: el cliente compra dentro de TikTok, la empresa puente (con la tienda y LLC) procesa el pedido, el producto se envía desde USA y tú ganas tu comisión. Simple y sin manejar stock ni envíos.',
    steps: [
      'El cliente ve el video del afiliado y compra en la tienda de TikTok',
      'La empresa puente procesa el pedido y cobra al cliente',
      'El producto se despacha desde un centro de envío en USA (2-5 días hábiles)',
      'Al confirmarse la venta, tu comisión se suma a tu saldo',
      'Los pagos se liberan en ciclos (semanales o quincenales según la plataforma)',
    ],
    links: [
      { label: 'Reglas y pagos de TikTok Shop', url: 'https://seller-us.tiktok.com' },
    ],
    statNumber: '2-5',
    statLabel: 'días hábiles en entregas dentro de USA',
    orderIndex: 3,
  },
  {
    slug: 'afiliados-tiktok',
    title: 'Consigue afiliados de TikTok Shop',
    subtitle: 'El motor de tus ventas: ellos hacen el video, tú ganas',
    icon: 'Users',
    image: `${IMG}afiliados.jpg`,
    description:
      'Tú no necesitas crear los videos ni tener tienda. Los afiliados de TikTok Shop hacen el contenido y venden tus productos de ryztor.com. Tu trabajo: conseguir los afiliados correctos y enviarles muestras. Un solo video que vende engancha ventas recurrentes durante semanas.',
    steps: [
      'Busca afiliados de TikTok Shop en tu nicho (belleza, tecnología, hogar)',
      'Prefiere micro-influencers: 5k-100k seguidores, audiencia comprometida',
      'Ofréceles muestra gratis + comisión por video',
      'Da instrucciones claras pero libres: que muestren el producto en uso',
      'Mide resultados y repite con los que vendan',
    ],
    links: [
      { label: 'Cómo se conectan afiliados', url: 'https://seller-us.tiktok.com' },
    ],
    statNumber: '5-100k',
    statLabel: 'seguidores ideales en micro-influencers que sí venden',
    orderIndex: 4,
  },
  {
    slug: 'cobra-tus-ventas',
    title: 'Cobra tus ventas',
    subtitle: 'Recibe tu comisión desde cualquier país',
    icon: 'Wallet',
    image: `${IMG}pagos.jpg`,
    description:
      'Las empresas puente pagan comisiones a cuentas internacionales. Abre una cuenta bancaria de USA a tu nombre con Meru (getmeru.com) para recibir tus pagos, o usa una cuenta virtual (Wise, Payoneer, Binance Pay) para cobrar directo en tu país y en tu moneda.',
    steps: [
      'Descarga Meru App (getmeru.com) y crea tu cuenta bancaria de USA a tu nombre',
      'Verifica tu identidad desde tu país (sin necesidad de residencia en USA)',
      'Recibe pagos de tus plataformas puente directo en tu cuenta de USA',
      'Alternativa: usa una cuenta virtual (Wise, Payoneer, Binance Pay)',
      'Retira a tu cuenta local o usa tu tarjeta en dólares cuando quieras',
    ],
    links: [
      { label: 'Meru App (cuenta bancaria USA)', url: 'https://getmeru.com' },
      { label: 'Wise', url: 'https://wise.com' },
      { label: 'Payoneer', url: 'https://www.payoneer.com' },
    ],
    statNumber: '1',
    statLabel: 'cuenta bancaria de USA a tu nombre con Meru App',
    orderIndex: 5,
  },
  {
    slug: 'envio-y-entregas',
    title: 'Entregas y envíos',
    subtitle: 'Cómo llegan los productos y quién los despacha',
    icon: 'Package',
    image: `${IMG}envio.jpg`,
    description:
      'Tú nunca tocas el producto. La empresa puente despacha desde su centro de envío en USA. Esto significa cero inventario, cero bodega y cero riesgo de perder dinero en stock que no se vende.',
    steps: [
      'El cliente paga el producto en TikTok Shop',
      'La empresa puente prepara y despacha el pedido desde USA',
      'Entrega estimada: 2-5 días hábiles dentro de USA',
      'Tú haces seguimiento y ganas comisión por cada venta confirmada',
      'Solicita retiro de tus ganancias cuando quieras',
    ],
    links: [
      { label: 'Catálogo ryztor.com', url: 'https://ryztor.com' },
    ],
    statNumber: '0',
    statLabel: 'inventario que tú tengas que manejar',
    orderIndex: 6,
  },
];

async function main() {
  for (const m of vipModules) {
    await prisma.vipProModule.upsert({
      where: { slug: m.slug },
      update: {
        title: m.title,
        subtitle: m.subtitle,
        icon: m.icon,
        image: m.image,
        description: m.description,
        steps: m.steps,
        links: m.links,
        checkItems: m.checkItems,
        statNumber: m.statNumber,
        statLabel: m.statLabel,
        orderIndex: m.orderIndex,
        isActive: true,
      },
      create: {
        slug: m.slug,
        title: m.title,
        subtitle: m.subtitle,
        icon: m.icon,
        image: m.image,
        description: m.description,
        steps: m.steps,
        links: m.links,
        checkItems: m.checkItems,
        statNumber: m.statNumber,
        statLabel: m.statLabel,
        orderIndex: m.orderIndex,
        isActive: true,
      },
    });
  }
  console.log('✅ Módulos VIP Pro sincronizados');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
