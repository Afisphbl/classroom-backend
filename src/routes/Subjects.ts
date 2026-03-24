import express from "express";
import { and, desc, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { departments, subjects } from "../db/schema/app";
const router = express.Router();

// Get all subjects with options for pagination, filtering, and search
router.get("/", async (req, res) => {
  try {
    const { search, departmentId, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100,
    );
    const offset = (currentPage - 1) * limitPerPage;
    const filterConditions = [];

    if (search) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }

    if (departmentId) {
      filterConditions.push(sql`${subjects.departmentId} = ${Number(departmentId)}`);
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .where(whereClause);

    const data = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        description: subjects.description,
        departmentId: subjects.departmentId,
        createdAt: subjects.createdAt,
        updatedAt: subjects.updatedAt,
        departmentName: departments.name,
      })
      .from(subjects)
      .leftJoin(departments, sql`${subjects.departmentId} = ${departments.id}`)
      .where(whereClause)
      .orderBy(desc(subjects.id))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalRows[0]?.count ?? 0,
        totalPages: Math.ceil((totalRows[0]?.count ?? 0) / limitPerPage),
      },
    });
  } catch (e) {
    console.error(`Get subjects failed: ${e}`);
    res.status(500).json({ error: "failed to get subjects" });
  }
});

export default router;
