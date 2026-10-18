import { PrismaClient } from "@prisma/client";
import {
  UserRole,
  DonationStatus,
  ClothingCondition,
  Priority,
  InventoryStatus,
  InventoryTransactionType,
  DistributionStatus,
  CampaignStatus,
} from "../lib/enums";
import * as bcrypt from "bcryptjs";
import { addDays, addHours, subMonths, subWeeks, subDays, format } from "date-fns";

const prisma = new PrismaClient();

const PASSWORD = "Password123!";
const SALT_ROUNDS = 10;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDonationId(n: number): string {
  return `DON-2026-${String(n).padStart(6, "0")}`;
}

async function main() {
  const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const now = new Date();

  console.log("🌱 Seeding database...");

  console.log("  1/22 Creating NGO...");
  const ngo = await prisma.nGO.create({
    data: {
      name: "Mangaldham Bahuuddeshiy Samajik Sanstha",
      tagline: "Giving clothes a second life, one donation at a time",
      address: "Sukhsagar Nagar, Katraj, Pune, Maharashtra",
      phone: "7219185111",
      email: "vijug0027@gmail.com",
      website: "https://rewearfoundation.org",
      logoUrl: "https://rewearfoundation.org/logo.png",
      receiptColor: "#2563EB",
    },
  });

  console.log("  2/22 Creating Users (1 NGO_ADMIN, 2 NGO_STAFF, 10 DONORS)...");
  const [ngoAdmin, ...staffAndDonors] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@rewear.org",
        passwordHash: hashedPassword,
        name: "Priya Sharma",
        phone: "+91 90000 00001",
        role: UserRole.NGO_ADMIN,
        ngoId: ngo.id,
        avatarUrl: "https://i.pravatar.cc/150?img=47",
      },
    }),
    prisma.user.create({
      data: {
        email: "staff.arjun@rewear.org",
        passwordHash: hashedPassword,
        name: "Arjun Verma",
        phone: "+91 90000 00002",
        role: UserRole.NGO_STAFF,
        ngoId: ngo.id,
        avatarUrl: "https://i.pravatar.cc/150?img=12",
      },
    }),
    prisma.user.create({
      data: {
        email: "staff.meera@rewear.org",
        passwordHash: hashedPassword,
        name: "Meera Patel",
        phone: "+91 90000 00003",
        role: UserRole.NGO_STAFF,
        ngoId: ngo.id,
        avatarUrl: "https://i.pravatar.cc/150?img=45",
      },
    }),
  ]);

  const ngoStaff1 = staffAndDonors[0];
  const ngoStaff2 = staffAndDonors[1];
  const staffUsers = [ngoStaff1, ngoStaff2];

  const donorData = [
    { email: "rahul.gupta@gmail.com", name: "Rahul Gupta", phone: "+91 98100 00001", img: 1 },
    { email: "ananya.singh@gmail.com", name: "Ananya Singh", phone: "+91 98100 00002", img: 5 },
    { email: "vikram.raj@gmail.com", name: "Vikram Raj", phone: "+91 98100 00003", img: 11 },
    { email: "neha.kapoor@gmail.com", name: "Neha Kapoor", phone: "+91 98100 00004", img: 20 },
    { email: "sanjay.menon@gmail.com", name: "Sanjay Menon", phone: "+91 98100 00005", img: 15 },
    { email: "isha.agarwal@gmail.com", name: "Isha Agarwal", phone: "+91 98100 00006", img: 49 },
    { email: "rohit.khan@gmail.com", name: "Rohit Khan", phone: "+91 98100 00007", img: 33 },
    { email: "tanya.nair@gmail.com", name: "Tanya Nair", phone: "+91 98100 00008", img: 44 },
    { email: "karan.bose@gmail.com", name: "Karan Bose", phone: "+91 98100 00009", img: 7 },
    { email: "priya.iyer@gmail.com", name: "Priya Iyer", phone: "+91 98100 00010", img: 10 },
  ];

  const donors = await Promise.all(
    donorData.map((d) =>
      prisma.user.create({
        data: {
          email: d.email,
          passwordHash: hashedPassword,
          name: d.name,
          phone: d.phone,
          role: UserRole.DONOR,
          avatarUrl: `https://i.pravatar.cc/150?img=${d.img}`,
        },
      })
    )
  );

  const allUsers = [ngoAdmin, ngoStaff1, ngoStaff2, ...donors];

  console.log("  3/22 Creating StaffAssignments...");
  const allModules = [
    "dashboard",
    "donations",
    "inventory",
    "requirements",
    "beneficiaries",
    "distributions",
    "campaigns",
    "reports",
    "impact_stories",
    "users",
    "audit_logs",
    "settings",
  ];
  await Promise.all([
    prisma.staffAssignment.create({
      data: {
        userId: ngoAdmin.id,
        ngoId: ngo.id,
        modules: JSON.stringify(allModules),
        assignedBy: ngoAdmin.id,
        assignedAt: subMonths(now, 3),
      },
    }),
    prisma.staffAssignment.create({
      data: {
        userId: ngoStaff1.id,
        ngoId: ngo.id,
        modules: JSON.stringify(["dashboard", "donations", "inventory", "distributions", "reports"]),
        assignedBy: ngoAdmin.id,
        assignedAt: subMonths(now, 2),
      },
    }),
    prisma.staffAssignment.create({
      data: {
        userId: ngoStaff2.id,
        ngoId: ngo.id,
        modules: JSON.stringify(["dashboard", "donations", "beneficiaries", "campaigns", "impact_stories"]),
        assignedBy: ngoAdmin.id,
        assignedAt: subMonths(now, 2),
      },
    }),
  ]);

  console.log("  4/22 Creating ClothingCategories (8 categories)...");
  const categoryData = [
    { name: "Shirts", slug: "shirts", genderAgeGroup: "Men", desc: "Formal and casual shirts for men", threshold: 25 },
    { name: "T-Shirts", slug: "t-shirts", genderAgeGroup: "Women", desc: "Everyday cotton t-shirts for women", threshold: 30 },
    { name: "Pants", slug: "pants", genderAgeGroup: "Children", desc: "Trousers, jeans, and bottoms for children", threshold: 20 },
    { name: "Jackets", slug: "jackets", genderAgeGroup: "Men", desc: "Winter jackets, blazers, and outerwear for men", threshold: 15 },
    { name: "Socks", slug: "socks", genderAgeGroup: "Infants", desc: "Warm socks for infants and toddlers", threshold: 50 },
    { name: "Dresses", slug: "dresses", genderAgeGroup: "Women", desc: "Casual and formal dresses for women", threshold: 20 },
    { name: "Sweaters", slug: "sweaters", genderAgeGroup: "Children", desc: "Woolen sweaters and cardigans for children", threshold: 20 },
    { name: "Baby Clothes", slug: "baby-clothes", genderAgeGroup: "Infants", desc: "Onesies, rompers, and layette for babies", threshold: 40 },
  ];

  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.clothingCategory.create({
        data: {
          name: c.name,
          slug: c.slug,
          description: c.desc,
          genderAgeGroup: c.genderAgeGroup,
          defaultReorderThreshold: c.threshold,
          ngoId: ngo.id,
          imageUrl: `https://images.unsplash.com/category-${c.slug}.jpg`,
        },
      })
    )
  );

  const adultSizes = ["S", "M", "L", "XL"];
  const kidsSizes = ["5-7Y", "8-10Y", "11-13Y"];
  const infantSizes = ["0-3M", "6-12M", "12-18M"];
  const allConditions: ClothingCondition[] = [
    ClothingCondition.NEW,
    ClothingCondition.LIKE_NEW,
    ClothingCondition.GOOD,
    ClothingCondition.FAIR,
    ClothingCondition.POOR,
  ];

  function sizesForCategory(catName: string): string[] {
    if (catName === "Baby Clothes" || catName === "Socks") return infantSizes;
    if (catName === "Pants" || catName === "Sweaters") return kidsSizes;
    return adultSizes;
  }

  console.log("  5/22 Creating Donations (>=30) with DonationItems and StatusHistory...");
  const NUM_DONATIONS = 32;
  const donationsToCreate = [];
  const donorDonationCounts: Record<number, number> = {};
  donors.forEach((d) => (donorDonationCounts[Number(d.id)] = randomInt(2, 4)));

  let dIdx = 0;
  for (const donor of donors) {
    const count = donorDonationCounts[Number(donor.id)];
    for (let i = 0; i < count; i++) {
      dIdx++;
      const isRejected = dIdx === 7 || dIdx === 23;
      const createdDate = subWeeks(subDays(now, randomInt(0, 14)), randomInt(1, 8));

      donationsToCreate.push({
        idx: dIdx,
        donorId: donor.id,
        donorName: donor.name,
        donorEmail: donor.email,
        donorPhone: donor.phone,
        createdDate,
        isRejected,
      });
    }
  }

  while (dIdx < NUM_DONATIONS) {
    dIdx++;
    const donor = pickRandom(donors);
    const isRejected = dIdx === 29;
    const createdDate = subWeeks(subDays(now, randomInt(0, 7)), randomInt(0, 6));
    donationsToCreate.push({
      idx: dIdx,
      donorId: donor.id,
      donorName: donor.name,
      donorEmail: donor.email,
      donorPhone: donor.phone,
      createdDate,
      isRejected,
    });
  }

  const createdDonations = [];
  const allDonationItems: any[] = [];
  const allStatusHistories: any[] = [];

  for (let di = 0; di < donationsToCreate.length; di++) {
    const d = donationsToCreate[di];
    const numItems = randomInt(1, 4);
    let totalItems = 0;
    const itemsInput = [];
    for (let ii = 0; ii < numItems; ii++) {
      const cat = pickRandom(categories);
      const qty = randomInt(2, 8);
      totalItems += qty;
      itemsInput.push({
        categoryId: cat.id,
        size: pickRandom(sizesForCategory(cat.name)),
        condition: pickRandom(allConditions),
        quantity: qty,
        description: `${cat.genderAgeGroup} ${cat.name} in ${pickRandom(allConditions).toLowerCase()} condition`,
      });
    }

    const statusesForDonation: DonationStatus[] = [];
    if (d.isRejected) {
      statusesForDonation.push(DonationStatus.SUBMITTED, DonationStatus.REJECTED);
    } else {
      const allProgress = [
        DonationStatus.SUBMITTED,
        DonationStatus.RECEIVED,
        DonationStatus.SORTED,
        DonationStatus.INVENTORY_ADDED,
        DonationStatus.ALLOCATED,
        DonationStatus.DISTRIBUTED,
        DonationStatus.COMPLETED,
      ];
      const numStatuses = randomInt(3, 7);
      for (let s = 0; s < Math.min(numStatuses, allProgress.length); s++) {
        statusesForDonation.push(allProgress[s]);
      }
    }

    const finalStatus = statusesForDonation[statusesForDonation.length - 1];

    const donation = await prisma.donation.create({
      data: {
        donationId: generateDonationId(d.idx),
        donorId: d.donorId,
        ngoId: ngo.id,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        donorPhone: d.donorPhone,
        pickupAddress: `${randomInt(1, 999)} ${pickRandom(["MG Road", "Linking Road", "Park Street", "Residency Road", "Bandra West"])}, ${pickRandom(["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad"])}`,
        notes: d.isRejected ? "Items did not meet quality standards" : "Donation dropped off at collection center",
        totalItems,
        currentStatus: finalStatus,
        rejectionReason: d.isRejected ? "Items heavily soiled or torn beyond usability" : null,
        createdAt: d.createdDate,
        updatedAt: addHours(d.createdDate, statusesForDonation.length * randomInt(3, 12)),
        items: { create: itemsInput },
      },
      include: { items: true },
    });
    createdDonations.push(donation);
    allDonationItems.push(...donation.items);

    for (let si = 0; si < statusesForDonation.length; si++) {
      const st = statusesForDonation[si];
      const staffChanger = pickRandom([ngoAdmin, ngoStaff1, ngoStaff2]);
      allStatusHistories.push({
        donationId: donation.id,
        status: st,
        note: st === DonationStatus.SUBMITTED
          ? "Donation submitted by donor"
          : st === DonationStatus.RECEIVED
          ? "Package received at collection hub"
          : st === DonationStatus.SORTED
          ? "Items sorted by category and condition"
          : st === DonationStatus.INVENTORY_ADDED
          ? "Items added to warehouse inventory"
          : st === DonationStatus.ALLOCATED
          ? "Items allocated to beneficiary program"
          : st === DonationStatus.DISTRIBUTED
          ? "Items distributed to beneficiaries"
          : st === DonationStatus.COMPLETED
          ? "Donation cycle completed and receipt issued"
          : st === DonationStatus.REJECTED
          ? "Donation rejected after quality inspection"
          : null,
        changedBy: staffChanger.id,
        createdAt: addHours(d.createdDate, si * randomInt(6, 36)),
      });
    }
  }

  await prisma.donationStatusHistory.createMany({ data: allStatusHistories });

  console.log("  6/22 Creating InventoryItems (>=25) with unique composite keys...");
  const inventoryItemInputs: any[] = [];
  const usedKeys = new Set<string>();
  const inventoryTarget = 28;

  for (const cat of categories) {
    const sizes = sizesForCategory(cat.name);
    for (const sz of sizes) {
      for (const cond of [ClothingCondition.NEW, ClothingCondition.LIKE_NEW, ClothingCondition.GOOD, ClothingCondition.FAIR]) {
        const key = `${ngo.id}-${cat.id}-${sz}-${cond}`;
        if (usedKeys.has(key)) continue;
        usedKeys.add(key);

        const qty = randomInt(5, 120);
        const reserved = Math.floor(qty * randomInt(0, 20) / 100);
        const distributed = Math.floor(qty * randomInt(5, 40) / 100);
        const available = qty - reserved;
        let status: InventoryStatus;
        if (available <= cat.defaultReorderThreshold / 2) status = InventoryStatus.LOW_STOCK;
        else if (available === 0) status = InventoryStatus.OUT_OF_STOCK;
        else if (reserved > 0) status = InventoryStatus.RESERVED;
        else status = InventoryStatus.IN_STOCK;

        inventoryItemInputs.push({
          ngoId: ngo.id,
          categoryId: cat.id,
          size: sz,
          genderAgeGroup: cat.genderAgeGroup,
          condition: cond,
          quantity: qty,
          availableQty: available,
          reservedQty: reserved,
          distributedQty: distributed,
          location: `Shelf-${randomInt(1, 12)}-A${randomInt(1, 9)}`,
          batchId: `BATCH-${format(subDays(now, randomInt(1, 60)), "yyyyMMdd")}-${String(randomInt(100, 999)).padStart(3, "0")}`,
          status,
        });
        if (inventoryItemInputs.length >= inventoryTarget) break;
      }
      if (inventoryItemInputs.length >= inventoryTarget) break;
    }
    if (inventoryItemInputs.length >= inventoryTarget) break;
  }

  const inventoryItemInputsDeduped: any[] = [];
  const seenComposite = new Set<string>();
  for (const it of inventoryItemInputs) {
    const ck = `${it.ngoId}|${it.categoryId}|${it.size ?? ""}|${it.condition}`;
    if (!seenComposite.has(ck)) {
      seenComposite.add(ck);
      inventoryItemInputsDeduped.push(it);
    }
  }
  await prisma.inventoryItem.createMany({
    data: inventoryItemInputsDeduped,
  });
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { ngoId: ngo.id },
  });

  console.log("  7/22 Creating InventoryTransactions (>=50)...");
  const transactions: any[] = [];
  const txTypes: InventoryTransactionType[] = [
    InventoryTransactionType.RECEIVED,
    InventoryTransactionType.ALLOCATED,
    InventoryTransactionType.DISTRIBUTED,
    InventoryTransactionType.ADJUSTED,
  ];
  const txTarget = 55;
  let donationItemIdx = 0;

  for (let ti = 0; ti < txTarget; ti++) {
    const inv = pickRandom(inventoryItems);
    const ttype = pickRandom(txTypes);
    const performer = pickRandom([ngoAdmin, ngoStaff1, ngoStaff2]);
    const baseDate = subDays(now, randomInt(0, 45));

    let qtyChange: number;
    if (ttype === InventoryTransactionType.RECEIVED || ttype === InventoryTransactionType.ADJUSTED) {
      qtyChange = randomInt(5, 50);
    } else {
      qtyChange = -randomInt(2, 30);
    }

    const donationItemForTx = allDonationItems[donationItemIdx % allDonationItems.length];
    donationItemIdx++;

    transactions.push({
      inventoryItemId: inv.id,
      donationItemId: ttype === InventoryTransactionType.RECEIVED ? donationItemForTx.id : null,
      type: ttype,
      quantityChange: qtyChange,
      unitNote: ttype === InventoryTransactionType.RECEIVED
        ? "From donation intake"
        : ttype === InventoryTransactionType.ALLOCATED
        ? "Allocated to distribution run"
        : ttype === InventoryTransactionType.DISTRIBUTED
        ? "Handed to beneficiary"
        : "Stock count adjustment after audit",
      performedBy: performer.id,
      ngoId: ngo.id,
      createdAt: addHours(baseDate, randomInt(1, 20)),
    });
  }
  await prisma.inventoryTransaction.createMany({ data: transactions });

  console.log("  8/22 Creating Requirements (>=6)...");
  const reqData = [
    { title: "Winter Jackets for Slum Children", cat: categories.find((c) => c.slug === "jackets")!, qty: 250, priority: Priority.CRITICAL, deadline: addDays(now, 20), program: "Winter Warmth 2026" },
    { title: "School Uniform Pants for Govt School", cat: categories.find((c) => c.slug === "pants")!, qty: 180, priority: Priority.HIGH, deadline: addDays(now, 35), program: "Back-to-School Drive" },
    { title: "Baby Onesies & Layette Sets", cat: categories.find((c) => c.slug === "baby-clothes")!, qty: 300, priority: Priority.HIGH, deadline: addDays(now, 10), program: "Newborn Support Program" },
    { title: "Women's Casual Dresses", cat: categories.find((c) => c.slug === "dresses")!, qty: 150, priority: Priority.MEDIUM, deadline: addDays(now, 45), program: "Women Empowerment" },
    { title: "Children's Woolen Sweaters", cat: categories.find((c) => c.slug === "sweaters")!, qty: 220, priority: Priority.CRITICAL, deadline: addDays(now, 15), program: "Winter Warmth 2026" },
    { title: "Rainproof Jackets & Warm Socks", cat: categories.find((c) => c.slug === "socks")!, qty: 100, priority: Priority.LOW, deadline: addDays(now, 60), program: "Monsoon Essentials" },
    { title: "Men's Office Shirts for Job Training", cat: categories.find((c) => c.slug === "shirts")!, qty: 130, priority: Priority.MEDIUM, deadline: addDays(now, 50), program: "Employment Readiness" },
  ];
  const requirements = await Promise.all(
    reqData.map((r) =>
      prisma.requirement.create({
        data: {
          ngoId: ngo.id,
          categoryId: r.cat.id,
          title: r.title,
          description: `Urgent requirement for ${r.title.toLowerCase()} to support our ongoing ${r.program} program.`,
          requiredQty: r.qty,
          priority: r.priority,
          deadline: r.deadline,
          program: r.program,
          fulfilledQty: randomInt(10, Math.floor(r.qty * 0.7)),
          active: true,
          createdBy: ngoAdmin.id,
        },
      })
    )
  );

  console.log("  9/22 Creating BeneficiaryGroups (4)...");
  const beneficiaryGroups = await Promise.all([
    prisma.beneficiaryGroup.create({
      data: {
        ngoId: ngo.id,
        groupCode: "BEN-GROUP-001",
        program: "Winter Warmth 2026",
        ageGroup: "Children 6-12",
        size: "M",
        status: "Active",
        notes: "Children from Govt. Primary School, Andheri East - 45 registered kids",
      },
    }),
    prisma.beneficiaryGroup.create({
      data: {
        ngoId: ngo.id,
        groupCode: "BEN-GROUP-002",
        program: "Back-to-School Drive",
        ageGroup: "Children 8-14",
        size: "L",
        status: "Active",
        notes: "Orphanage residents - St. Mary's Home - 60 registered kids",
      },
    }),
    prisma.beneficiaryGroup.create({
      data: {
        ngoId: ngo.id,
        groupCode: "BEN-GROUP-003",
        program: "Newborn Support Program",
        ageGroup: "Infants 0-18M",
        size: "6-12M",
        status: "Active",
        notes: "Low-income newborns at Sion Hospital maternity ward - 80 babies",
      },
    }),
    prisma.beneficiaryGroup.create({
      data: {
        ngoId: ngo.id,
        groupCode: "BEN-GROUP-004",
        program: "Women Empowerment",
        ageGroup: "Women 18-45",
        size: "L",
        status: "Active",
        notes: "Self-help group members in Dharavi - 35 registered women",
      },
    }),
  ]);

  console.log("  10/22 Creating BeneficiaryGroupRequirements...");
  const bgrData: any[] = [];
  for (const bg of beneficiaryGroups) {
    const numCats = randomInt(2, 4);
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numCats; i++) {
      bgrData.push({
        beneficiaryGroupId: bg.id,
        categoryId: shuffled[i].id,
        requiredQty: randomInt(20, 100),
        note: `${bg.program} - ${shuffled[i].name} for ${bg.ageGroup}`,
      });
    }
  }
  await prisma.beneficiaryGroupRequirement.createMany({ data: bgrData });

  console.log("  11/22 Creating Distributions (4)...");
  const distributions = await Promise.all([
    prisma.distribution.create({
      data: {
        ngoId: ngo.id,
        name: "Winter Warmth Drive - Phase 1",
        description: "Distribution of winter jackets, sweaters, and socks to children in Andheri East",
        program: "Winter Warmth 2026",
        location: "Govt. Primary School Hall, Andheri East",
        eventDate: addDays(now, -12),
        beneficiaryGroupId: beneficiaryGroups[0].id,
        status: DistributionStatus.COMPLETED,
        totalItems: 185,
        createdBy: ngoAdmin.id,
        completedAt: addDays(now, -11),
      },
    }),
    prisma.distribution.create({
      data: {
        ngoId: ngo.id,
        name: "Back-to-School - St. Mary's",
        description: "School uniforms, pants, and dresses for orphanage children",
        program: "Back-to-School Drive",
        location: "St. Mary's Orphanage, Bandra West",
        eventDate: addDays(now, -5),
        beneficiaryGroupId: beneficiaryGroups[1].id,
        status: DistributionStatus.COMPLETED,
        totalItems: 140,
        createdBy: ngoStaff1.id,
        completedAt: addDays(now, -4),
      },
    }),
    prisma.distribution.create({
      data: {
        ngoId: ngo.id,
        name: "Newborn Support - Sion Hospital",
        description: "Baby clothes, onesies, socks distribution at maternity ward",
        program: "Newborn Support Program",
        location: "Sion Hospital Maternity Ward",
        eventDate: addDays(now, 3),
        beneficiaryGroupId: beneficiaryGroups[2].id,
        status: DistributionStatus.IN_PROGRESS,
        totalItems: 95,
        createdBy: ngoStaff2.id,
      },
    }),
    prisma.distribution.create({
      data: {
        ngoId: ngo.id,
        name: "Women SHG - Dharavi Distribution",
        description: "Dresses, t-shirts, and clothing kits for self-help group women",
        program: "Women Empowerment",
        location: "Dharavi Community Center",
        eventDate: addDays(now, 10),
        beneficiaryGroupId: beneficiaryGroups[3].id,
        status: DistributionStatus.DRAFT,
        totalItems: 0,
        createdBy: ngoAdmin.id,
      },
    }),
  ]);

  console.log("  12/22 Creating DistributionItems (>=20)...");
  const distItems: any[] = [];
  const completedDists = distributions.filter((d) => d.status === DistributionStatus.COMPLETED || d.status === DistributionStatus.IN_PROGRESS);
  let invItemIdx = 0;
  for (const dist of completedDists) {
    const numItems = randomInt(5, 9);
    for (let i = 0; i < numItems; i++) {
      const inv = inventoryItems[invItemIdx % inventoryItems.length];
      invItemIdx++;
      distItems.push({
        distributionId: dist.id,
        inventoryItemId: inv.id,
        categoryId: inv.categoryId,
        size: inv.size,
        quantity: randomInt(5, 30),
        beneficiaryGroupId: dist.beneficiaryGroupId,
        note: `Distributed at ${dist.name}`,
      });
    }
  }
  await prisma.distributionItem.createMany({ data: distItems });

  console.log("  13/22 Creating Campaigns (exactly 3)...");
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        ngoId: ngo.id,
        name: "Winter Warmth",
        slug: "winter-warmth-2026",
        description: "Collect warm clothing for 500+ children and families in need this winter season. Every jacket, sweater, and blanket makes a difference.",
        coverImageUrl: "https://images.unsplash.com/winter-campaign-cover.jpg",
        targetQty: 500,
        startDate: subMonths(now, 1),
        endDate: addDays(now, 45),
        priority: Priority.HIGH,
        status: CampaignStatus.ACTIVE,
        createdBy: ngoAdmin.id,
      },
    }),
    prisma.campaign.create({
      data: {
        ngoId: ngo.id,
        name: "Back-to-School Drive",
        slug: "back-to-school-2026",
        description: "Help 300 children get ready for the new school year with uniforms, shoes, and everyday essentials.",
        coverImageUrl: "https://images.unsplash.com/back-to-school-cover.jpg",
        targetQty: 300,
        startDate: subWeeks(now, 6),
        endDate: addDays(now, 20),
        priority: Priority.MEDIUM,
        status: CampaignStatus.ACTIVE,
        createdBy: ngoStaff2.id,
      },
    }),
    prisma.campaign.create({
      data: {
        ngoId: ngo.id,
        name: "Monsoon Essentials",
        slug: "monsoon-essentials-2025",
        description: "Raincoats, waterproof clothing, umbrellas and essentials for 200 families during monsoon season.",
        coverImageUrl: "https://images.unsplash.com/monsoon-cover.jpg",
        targetQty: 200,
        startDate: subMonths(now, 5),
        endDate: subMonths(now, 2),
        priority: Priority.LOW,
        status: CampaignStatus.COMPLETED,
        createdBy: ngoAdmin.id,
      },
    }),
  ]);

  console.log("  14/22 Creating CampaignDonation links (>=25)...");
  const campaignDonations: any[] = [];
  const cdsTarget = 28;
  for (let ci = 0; ci < cdsTarget; ci++) {
    const camp = pickRandom(campaigns);
    const don = createdDonations[ci % createdDonations.length];
    if (don.currentStatus === DonationStatus.REJECTED) continue;
    campaignDonations.push({
      campaignId: camp.id,
      donationId: don.id,
      itemsCount: don.totalItems,
      assignedAt: addHours(don.createdAt, randomInt(1, 24)),
    });
  }
  await prisma.campaignDonation.createMany({
    data: campaignDonations,
  });

  console.log("  15/22 Creating ImpactStories (>=3, 2 published)...");
  const impactStories = await Promise.all([
    prisma.impactStory.create({
      data: {
        ngoId: ngo.id,
        title: "Little Riya's First Warm Winter",
        slug: "riya-first-warm-winter",
        content: "Seven-year-old Riya lives with her grandmother in a one-room home in Govandi. Last year, she came to school with a thin cotton shawl even in 12-degree weather. When our team dropped off a thick woolen sweater, jacket, and warm socks from the Winter Warmth drive, she couldn't stop hugging the jacket. 'Now I can play outside without shivering,' she told us, smiling. Her grandmother said it was the first time someone had gifted them winter clothes. Stories like Riya's are why we show up every day.",
        coverImageUrl: "https://images.unsplash.com/impact-story-1.jpg",
        itemsDistributed: 3,
        program: "Winter Warmth 2025",
        stats: JSON.stringify({ childrenSupported: 450, itemsDistributed: 1820, locationsCovered: 12 }),
        published: true,
        publishedAt: subMonths(now, 2),
        authorId: ngoStaff2.id,
      },
    }),
    prisma.impactStory.create({
      data: {
        ngoId: ngo.id,
        title: "The SHG Women Who Sewed New Futures",
        slug: "shg-women-new-futures",
        content: "Thirty-five women from the Dharavi Women's Self-Help Group received donated dresses, kurtis, and office wear through our Women Empowerment program. What started as clothing donations turned into a skill-building workshop where the women upcycled leftover fabric into bags and cushion covers, which they now sell at local markets. Group leader Lakshmi says, 'The clothes gave us confidence. The skills gave us income.' Their micro-enterprise has grown 3x in six months, and three members have opened their own tailoring units.",
        coverImageUrl: "https://images.unsplash.com/impact-story-2.jpg",
        itemsDistributed: 140,
        program: "Women Empowerment",
        stats: JSON.stringify({ womenSupported: 35, incomeGeneratedPct: 210, microEnterprises: 3 }),
        published: true,
        publishedAt: subMonths(now, 1),
        authorId: ngoAdmin.id,
      },
    }),
    prisma.impactStory.create({
      data: {
        ngoId: ngo.id,
        title: "Baby Aryan's Welcome Kit",
        slug: "baby-aryan-welcome-kit",
        content: "When Pramila delivered baby Aryan prematurely at Sion Hospital, her family had nothing ready — no onesies, no swaddles, no diapers. Our Newborn Support team arrived with a full layette set: onesies, sleep suits, socks, caps, muslin swaddles, and a blanket. Pramila cried as she dressed Aryan for the first time in soft, clean clothes. 'I was so worried about how I would afford all of this,' she said. 'You gave my son a warm welcome.'",
        coverImageUrl: "https://images.unsplash.com/impact-story-3.jpg",
        itemsDistributed: 12,
        program: "Newborn Support Program",
        published: false,
        authorId: ngoStaff2.id,
      },
    }),
  ]);

  console.log("  16/22 Creating Notifications (>=30)...");
  const notifications: any[] = [];
  const notifTemplates = [
    { title: "Donation Received", msg: (n: string) => `Thank you ${n}! Your donation has been received at our collection hub.`, related: "donation" },
    { title: "Donation Sorted", msg: () => "Your donation items have been sorted and categorized by our team.", related: "donation" },
    { title: "Inventory Added", msg: () => "Your donated items have been added to the warehouse inventory.", related: "donation" },
    { title: "Items Distributed", msg: () => "Great news! Items from your donation have been distributed to families in need.", related: "donation" },
    { title: "Donation Complete", msg: () => "Your donation cycle is complete. A receipt has been generated.", related: "donation" },
    { title: "New Requirement Posted", msg: (t: string) => `A new requirement has been posted: "${t}".`, related: "requirement" },
    { title: "Campaign Update", msg: (c: string) => `${c} campaign has received new donations this week.`, related: "campaign" },
    { title: "Distribution Scheduled", msg: (d: string) => `Distribution event "${d}" is scheduled.`, related: "distribution" },
    { title: "Low Stock Alert", msg: (c: string) => `Alert: ${c} is running low on stock. Please review inventory.`, related: "inventory" },
    { title: "Welcome to ReWear", msg: () => "Welcome to ReWear Foundation! Thank you for joining our community.", related: null },
  ];

  const notifTarget = 35;
  for (let ni = 0; ni < notifTarget; ni++) {
    const user = allUsers[ni % allUsers.length];
    const tpl = pickRandom(notifTemplates);
    const isRead = Math.random() > 0.35;
    const readAt = isRead ? subDays(now, randomInt(0, 10)) : null;

    let relatedId: number | null = null;
    let relatedType: string | null = null;
    if (tpl.related === "donation" && createdDonations.length) {
      const d = pickRandom(createdDonations);
      relatedId = d.id;
      relatedType = "donation";
    } else if (tpl.related === "requirement" && requirements.length) {
      const r = pickRandom(requirements);
      relatedId = r.id;
      relatedType = "requirement";
    } else if (tpl.related === "campaign" && campaigns.length) {
      const c = pickRandom(campaigns);
      relatedId = c.id;
      relatedType = "campaign";
    }

    const msgArg = tpl.related === "donation"
      ? user.name
      : tpl.related === "requirement"
      ? pickRandom(requirements).title
      : tpl.related === "campaign"
      ? pickRandom(campaigns).name
      : tpl.related === "inventory"
      ? pickRandom(categories).name
      : "";

    notifications.push({
      userId: user.id,
      title: tpl.title,
      message: tpl.msg(msgArg),
      relatedType,
      relatedId,
      read: isRead,
      readAt,
      createdAt: subDays(now, randomInt(0, 30)),
    });
  }
  await prisma.notification.createMany({ data: notifications });

  console.log("  17/22 Creating DonationReceipts (>=20)...");
  const completedDonations = createdDonations.filter((d) => d.currentStatus === DonationStatus.COMPLETED);
  const receipts: any[] = [];
  for (let ri = 0; ri < Math.min(22, completedDonations.length); ri++) {
    const don = completedDonations[ri];
    receipts.push({
      donationId: don.id,
      ngoId: ngo.id,
      generatedBy: pickRandom([ngoAdmin.id, ngoStaff1.id, ngoStaff2.id]),
      receiptNumber: `RCPT-${format(don.createdAt, "yyyyMMdd")}-${String(ri + 1).padStart(4, "0")}`,
      pdfUrl: `https://rewearfoundation.org/receipts/${don.donationId}.pdf`,
      issuedAt: addDays(don.createdAt, randomInt(1, 7)),
    });
  }
  await prisma.donationReceipt.createMany({ data: receipts });

  console.log("  18/22 Creating AuditLogs (>=15)...");
  const auditTemplates = [
    { action: "CREATE", target: "Donation", note: "Donation submitted" },
    { action: "UPDATE_STATUS", target: "Donation", note: "Donation status changed" },
    { action: "CREATE", target: "User", note: "Staff user created" },
    { action: "ASSIGN_ROLE", target: "User", note: "Role assigned to user" },
    { action: "CREATE", target: "InventoryItem", note: "Inventory item created" },
    { action: "ADJUST", target: "InventoryItem", note: "Inventory quantity adjusted" },
    { action: "CREATE", target: "Requirement", note: "New requirement posted" },
    { action: "CREATE", target: "Campaign", note: "New campaign launched" },
    { action: "UPDATE", target: "Campaign", note: "Campaign status updated" },
    { action: "CREATE", target: "Distribution", note: "Distribution event created" },
    { action: "COMPLETE", target: "Distribution", note: "Distribution event marked complete" },
    { action: "GENERATE", target: "DonationReceipt", note: "Donation receipt generated" },
    { action: "PUBLISH", target: "ImpactStory", note: "Impact story published" },
    { action: "LOGIN", target: "Session", note: "User logged in successfully" },
    { action: "UPDATE_SETTINGS", target: "NGO", note: "NGO profile settings updated" },
    { action: "ALLOCATE", target: "InventoryItem", note: "Inventory items allocated for distribution" },
    { action: "APPROVE", target: "StaffAssignment", note: "Staff assignment approved" },
  ];
  const auditTarget = 18;
  const auditLogs: any[] = [];
  for (let ai = 0; ai < auditTarget; ai++) {
    const tpl = auditTemplates[ai % auditTemplates.length];
    const actor = pickRandom([ngoAdmin, ngoStaff1, ngoStaff2]);
    auditLogs.push({
      ngoId: ngo.id,
      actorId: actor.id,
      actorRole: actor.role,
      action: tpl.action,
      targetType: tpl.target,
      targetId: null,
      metadata: JSON.stringify({ note: tpl.note, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }),
      ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      createdAt: subDays(now, randomInt(0, 60)),
    });
  }
  await prisma.auditLog.createMany({ data: auditLogs });

  console.log("\n✅ Seed data counts (intended):");
  console.log("  NGO: 1");
  console.log("  Users: 13 (1 NGO_ADMIN + 2 NGO_STAFF + 10 DONORS)");
  console.log("  StaffAssignments: 3 (2 staff + 1 admin)");
  console.log("  ClothingCategories: 8");
  console.log(`  Donations: ${NUM_DONATIONS} (2 REJECTED)`);
  console.log(`  DonationItems: ${allDonationItems.length} (1-4 per donation)`);
  console.log(`  DonationStatusHistory: ${allStatusHistories.length} (3-7 per donation)`);
  console.log(`  InventoryItems: ${inventoryItems.length} (unique ngoId+categoryId+size+condition)`);
  console.log(`  InventoryTransactions: ${transactions.length}`);
  console.log(`  Requirements: ${requirements.length}`);
  console.log(`  BeneficiaryGroups: ${beneficiaryGroups.length} (BEN-GROUP-001..004)`);
  console.log(`  BeneficiaryGroupRequirement: ${bgrData.length}`);
  console.log(`  Distributions: ${distributions.length} (2 COMPLETED, 1 IN_PROGRESS, 1 DRAFT)`);
  console.log(`  DistributionItems: ${distItems.length}`);
  console.log(`  Campaigns: ${campaigns.length} (2 ACTIVE, 1 COMPLETED)`);
  console.log(`  CampaignDonation: ${campaignDonations.length}`);
  console.log(`  ImpactStories: ${impactStories.length} (2 published)`);
  console.log(`  Notifications: ${notifications.length} (mix read/unread)`);
  console.log(`  DonationReceipts: ${receipts.length}`);
  console.log(`  AuditLogs: ${auditLogs.length}`);
}

main()
  .then(() => {
    console.log("\n🎉 Seed completed successfully!");
  })
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
