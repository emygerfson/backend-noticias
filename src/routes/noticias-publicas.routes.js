
import { Router } from "express";

import {
    listarNoticiasPublicas,
    buscarNoticiaPublica,
    buscarImagemPublica
} from "../controllers/noticias.controller.js";

const router = Router();

// Não exige login: são rotas públicas.
router.get("/", listarNoticiasPublicas);

// Serve imagens persistidas no PostgreSQL (rota pública).
router.get("/imagem/:nome", buscarImagemPublica);

// Busca notícia por slug (deve ficar por último por usar parâmetro genérico).
router.get("/:slug", buscarNoticiaPublica);

export default router;
