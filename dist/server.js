import S from"express";import jo from"dotenv";import ho from"cors";import bo from"helmet";import Y from"express-session";import wo from"connect-pg-simple";import _o from"express-rate-limit";import Z from"pg";import K from"dotenv";K.config();var{Pool:X}=Z,s=new X({connectionString:process.env.DATABASE_URL});async function y(){try{let e=await s.query("SELECT NOW()");return console.log("PostgreSQL conectado com sucesso!"),console.log("Hor\xE1rio do banco:",e.rows[0].now),!0}catch(e){return console.error("Erro ao conectar com PostgreSQL:",e.message),!1}}import{Router as eo}from"express";import to from"express-rate-limit";import oo from"bcryptjs";import{z as f}from"zod";var ao=f.object({email:f.string().email().max(180),senha:f.string().min(1).max(200)});async function T(e,a){try{let o=ao.safeParse(e.body);if(!o.success)return a.status(400).json({mensagem:"Informe um e-mail e uma senha v\xE1lidos."});let t=o.data.email.trim().toLowerCase(),r=o.data.senha,u=(await s.query(`SELECT id, nome, email, senha_hash, ativo
       FROM admins
       WHERE email = $1
       LIMIT 1`,[t])).rows[0];if(!u||!u.ativo)return a.status(401).json({mensagem:"E-mail ou senha incorretos."});if(!await oo.compare(r,u.senha_hash))return a.status(401).json({mensagem:"E-mail ou senha incorretos."});e.session.regenerate(R=>{if(R)return console.error("Erro ao criar sess\xE3o:",R),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel iniciar sua sess\xE3o."});e.session.adminId=u.id,e.session.save(v=>v?(console.error("Erro ao salvar sess\xE3o:",v),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel salvar sua sess\xE3o."})):a.status(200).json({mensagem:"Login realizado com sucesso!",usuario:{id:u.id,nome:u.nome,email:u.email}}))})}catch(o){return console.error("Erro no login:",o),a.status(500).json({mensagem:"Erro interno ao realizar login."})}}async function j(e,a){try{let t=(await s.query(`SELECT id, nome, email
       FROM admins
       WHERE id = $1 AND ativo = TRUE
       LIMIT 1`,[e.session.adminId])).rows[0];return t?a.status(200).json({autenticado:!0,usuario:t}):a.status(401).json({mensagem:"Sess\xE3o inv\xE1lida."})}catch(o){return console.error("Erro ao consultar sess\xE3o:",o),a.status(500).json({mensagem:"Erro ao verificar autentica\xE7\xE3o."})}}function h(e,a){e.session.destroy(o=>o?(console.error("Erro ao encerrar sess\xE3o:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel encerrar a sess\xE3o."})):(a.clearCookie("connect.sid",{httpOnly:!0,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/"}),a.status(200).json({mensagem:"Logout realizado com sucesso!"})))}async function l(e,a,o){try{if(!e.session?.adminId)return a.status(401).json({autenticado:!1,mensagem:"Voc\xEA precisa realizar login."});let r=(await s.query(`SELECT id, nome, email
       FROM admins
       WHERE id = $1 AND ativo = TRUE
       LIMIT 1`,[e.session.adminId])).rows[0];if(!r)return e.session.destroy(()=>a.status(401).json({autenticado:!1,mensagem:"Usu\xE1rio n\xE3o autorizado."}));e.admin=r,o()}catch(t){return console.error("Erro no middleware de autentica\xE7\xE3o:",t),a.status(500).json({mensagem:"Erro ao verificar autoriza\xE7\xE3o."})}}var p=eo(),so=to({windowMs:900*1e3,limit:10,standardHeaders:"draft-8",legacyHeaders:!1,message:{mensagem:"Muitas tentativas. Tente novamente mais tarde."}});function b(e,a,o){let t=e.get("Origin");if(t&&t!==process.env.FRONTEND_URL)return a.status(403).json({mensagem:"Origem n\xE3o autorizada."});o()}p.post("/login",b,so,T);p.get("/me",l,j);p.post("/logout",b,l,h);var w=p;import{Router as Eo}from"express";import{z as i}from"zod";var _=i.object({titulo:i.string().min(5).max(200),resumo:i.string().min(10).max(500),conteudo:i.string().min(10),categoria:i.string().min(2).max(100),imagem_url:i.string().optional().nullable(),fonte:i.string().optional().nullable(),status:i.enum(["rascunho","publicada","arquivada"]).optional()});function ro(e){return e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}async function x(e,a){try{let o=await s.query(`
      SELECT
        n.id,
        n.titulo,
        n.slug,
        n.resumo,
        n.categoria,
        n.status,
        n.imagem_url,
        n.fonte,
        n.publicada_em,
        n.criado_em,
        a.nome AS autor
      FROM noticias n
      JOIN admins a ON a.id = n.autor_id
      ORDER BY n.criado_em DESC
    `);return a.json(o.rows)}catch(o){return console.error(o),a.status(500).json({mensagem:"Erro ao listar not\xEDcias."})}}async function L(e,a){try{let o=_.parse(e.body),r=`${ro(o.titulo)}-${Date.now()}`,d=o.status||"rascunho",u=await s.query(`INSERT INTO noticias (
        titulo,
        slug,
        resumo,
        conteudo,
        categoria,
        imagem_url,
        fonte,
        status,
        autor_id,
        publicada_em
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
        CASE WHEN $8::varchar = 'publicada' THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING *`,[o.titulo,r,o.resumo,o.conteudo,o.categoria,o.imagem_url||null,o.fonte||null,d,e.admin.id]);return a.status(201).json({mensagem:"Not\xEDcia cadastrada com sucesso!",noticia:u.rows[0]})}catch(o){return o instanceof i.ZodError?a.status(400).json({mensagem:"Verifique os dados informados.",erros:o.issues}):(console.error(o),a.status(500).json({mensagem:"Erro ao cadastrar not\xEDcia."}))}}async function $(e,a){try{let{id:o}=e.params;if(!/^\d+$/.test(o))return a.status(400).json({mensagem:"ID inv\xE1lido."});let t=await s.query("SELECT * FROM noticias WHERE id = $1",[o]);return t.rows.length===0?a.status(404).json({mensagem:"Not\xEDcia n\xE3o encontrada."}):a.json(t.rows[0])}catch(o){return console.error(o),a.status(500).json({mensagem:"Erro ao buscar not\xEDcia."})}}async function I(e,a){try{let{id:o}=e.params;if(!/^\d+$/.test(o))return a.status(400).json({mensagem:"ID inv\xE1lido."});let t=_.parse(e.body),r=await s.query(`UPDATE noticias
       SET titulo = $1,
           resumo = $2,
           conteudo = $3,
           categoria = $4,
           imagem_url = $5,
           fonte = $6,
           status = $7,
           publicada_em = CASE
             WHEN $7 = 'publicada'
               THEN COALESCE(publicada_em, CURRENT_TIMESTAMP)
             ELSE NULL
           END,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,[t.titulo,t.resumo,t.conteudo,t.categoria,t.imagem_url||null,t.fonte||null,t.status||"rascunho",o]);return r.rows.length===0?a.status(404).json({mensagem:"Not\xEDcia n\xE3o encontrada."}):a.json({mensagem:"Not\xEDcia atualizada com sucesso!",noticia:r.rows[0]})}catch(o){return o instanceof i.ZodError?a.status(400).json({mensagem:"Verifique os dados informados.",erros:o.issues}):(console.error(o),a.status(500).json({mensagem:"Erro ao atualizar not\xEDcia."}))}}async function C(e,a){try{let{id:o}=e.params,{status:t}=e.body;if(!/^\d+$/.test(o))return a.status(400).json({mensagem:"ID inv\xE1lido."});if(!["rascunho","publicada","arquivada"].includes(t))return a.status(400).json({mensagem:"Status inv\xE1lido."});let r=await s.query(`UPDATE noticias
       SET status = $1,
           publicada_em = CASE
             WHEN $1 = 'publicada'
               THEN COALESCE(publicada_em, CURRENT_TIMESTAMP)
             ELSE NULL
           END,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,[t,o]);return r.rows.length===0?a.status(404).json({mensagem:"Not\xEDcia n\xE3o encontrada."}):a.json({mensagem:"Status atualizado com sucesso!",noticia:r.rows[0]})}catch(o){return console.error(o),a.status(500).json({mensagem:"Erro ao alterar status."})}}async function M(e,a){try{let o=await s.query(`
            SELECT
                id,
                titulo,
                slug,
                resumo,
                conteudo,
                categoria,
                imagem_url,
                fonte,
                publicada_em
            FROM noticias
            WHERE status = 'publicada'
            ORDER BY publicada_em DESC NULLS LAST
        `);return a.json(o.rows)}catch(o){return console.error("Erro ao listar not\xEDcias p\xFAblicas:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel carregar as not\xEDcias."})}}async function A(e,a){try{let{slug:o}=e.params,t=await s.query(`SELECT
                id,
                titulo,
                slug,
                resumo,
                conteudo,
                categoria,
                imagem_url,
                fonte,
                publicada_em
             FROM noticias
             WHERE slug = $1
             AND status = 'publicada'`,[o]);return t.rows.length===0?a.status(404).json({mensagem:"Not\xEDcia n\xE3o encontrada."}):a.json(t.rows[0])}catch(o){return console.error("Erro ao buscar not\xEDcia p\xFAblica:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel carregar a not\xEDcia."})}}import P from"multer";import U from"node:path";import no from"node:fs";import{randomUUID as io}from"node:crypto";import{fileURLToPath as mo}from"node:url";var uo=mo(import.meta.url),co=U.dirname(uo),O=U.resolve(co,"../../uploads/noticias");no.mkdirSync(O,{recursive:!0});var lo=["image/jpeg","image/png","image/webp"],go=P.diskStorage({destination:(e,a,o)=>{o(null,O)},filename:(e,a,o)=>{let t={"image/jpeg":".jpg","image/png":".png","image/webp":".webp"},r=`${io()}${t[a.mimetype]}`;o(null,r)}});function po(e,a,o){if(!lo.includes(a.mimetype))return o(new Error("Formato inv\xE1lido. Envie JPG, PNG ou WEBP."));o(null,!0)}var fo=P({storage:go,fileFilter:po,limits:{fileSize:5*1024*1024,files:1}}),z=fo.single("imagem");async function D(e,a){try{if(!e.file)return a.status(400).json({mensagem:"Selecione uma imagem para enviar."});let o=`/uploads/noticias/${e.file.filename}`;return a.status(201).json({mensagem:"Imagem enviada com sucesso!",imagem_url:o,arquivo:e.file.filename})}catch(o){return console.error("Erro no upload da imagem:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel enviar a imagem."})}}var c=Eo();c.use(l);c.post("/imagem",z,D);c.get("/",x);c.post("/",L);c.get("/:id",$);c.put("/:id",I);c.patch("/:id/status",C);var q=c;import{Router as No}from"express";var E=No();E.get("/",M);E.get("/:slug",A);var H=E;import{Router as Ro}from"express";import vo from"express-rate-limit";import{z as m}from"zod";var So=m.object({nome:m.string().trim().min(2).max(150),email:m.string().trim().email().max(180).optional().or(m.literal("")),telefone:m.string().trim().max(30).optional(),bairro:m.string().trim().max(120).optional(),tipo:m.enum(["comunidade","contato"]),assunto:m.string().trim().max(200).optional(),mensagem:m.string().trim().min(5).max(5e3),consentimento:m.literal(!0)});async function W(e,a){try{let o=So.safeParse(e.body);if(!o.success)return a.status(400).json({mensagem:"Verifique os campos enviados.",erros:o.error.flatten()});let t=o.data,r=await s.query(`INSERT INTO mensagens
            (nome, email, telefone, bairro, tipo, assunto, mensagem, consentimento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, criado_em`,[t.nome,t.email||null,t.telefone||null,t.bairro||null,t.tipo,t.assunto||null,t.mensagem,t.consentimento]);return a.status(201).json({mensagem:"Mensagem enviada com sucesso!",id:r.rows[0].id})}catch(o){return console.error("Erro ao cadastrar mensagem:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel enviar sua mensagem."})}}var F=Ro(),yo=vo({windowMs:900*1e3,limit:5,message:{mensagem:"Muitas tentativas. Aguarde alguns minutos."}});F.post("/",yo,W);var B=F;import{Router as To}from"express";async function V(e,a){try{let o=await s.query(`
            SELECT
                id,
                nome,
                email,
                telefone,
                bairro,
                tipo,
                assunto,
                mensagem,
                status,
                consentimento,
                criado_em,
                atualizado_em
            FROM mensagens
            ORDER BY criado_em DESC
        `);return a.status(200).json({total:o.rowCount,mensagens:o.rows})}catch(o){return console.error("Erro ao listar mensagens:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel carregar as mensagens."})}}async function G(e,a){try{let o=Number(e.params.id);if(!Number.isInteger(o)||o<=0)return a.status(400).json({mensagem:"ID inv\xE1lido."});let t=await s.query("SELECT * FROM mensagens WHERE id = $1",[o]);return t.rowCount===0?a.status(404).json({mensagem:"Mensagem n\xE3o encontrada."}):a.status(200).json(t.rows[0])}catch(o){return console.error("Erro ao buscar mensagem:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel buscar a mensagem."})}}async function Q(e,a){try{let o=Number(e.params.id),{status:t}=e.body,r=["nova","em_analise","respondida","arquivada"];if(!Number.isInteger(o)||o<=0)return a.status(400).json({mensagem:"ID inv\xE1lido."});if(!r.includes(t))return a.status(400).json({mensagem:"Status informado inv\xE1lido."});let d=await s.query(`UPDATE mensagens
             SET status = $1,
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, status, atualizado_em`,[t,o]);return d.rowCount===0?a.status(404).json({mensagem:"Mensagem n\xE3o encontrada."}):a.status(200).json({mensagem:"Status atualizado com sucesso.",dados:d.rows[0]})}catch(o){return console.error("Erro ao atualizar mensagem:",o),a.status(500).json({mensagem:"N\xE3o foi poss\xEDvel atualizar o status."})}}var g=To();g.use(l);g.get("/",V);g.get("/:id",G);g.patch("/:id/status",Q);var k=g;import J from"node:path";import{fileURLToPath as xo}from"node:url";jo.config();var n=S(),N=process.env.PORT||3333,Lo=xo(import.meta.url),$o=J.dirname(Lo),Io=J.resolve($o,"../uploads"),Co=wo(Y);n.use(bo());n.use("/uploads",(e,a,o)=>{a.setHeader("Cross-Origin-Resource-Policy","cross-origin"),o()},S.static(Io));n.use(ho({origin:process.env.FRONTEND_URL,credentials:!0}));n.use(S.json({limit:"1mb"}));var Mo=_o({windowMs:900*1e3,limit:200,standardHeaders:"draft-8",legacyHeaders:!1});n.use("/api",Mo);n.use(Y({name:"emygerfson.sid",store:new Co({pool:s,tableName:"session",createTableIfMissing:!0}),secret:process.env.SESSION_SECRET,resave:!1,saveUninitialized:!1,cookie:{httpOnly:!0,secure:!1,sameSite:"lax",maxAge:1e3*60*60*8,path:"/"}}));n.use("/api/auth",w);n.use("/api/admin/noticias",q);n.use("/api/noticias",H);n.use("/api/mensagens",B);n.use("/api/admin/mensagens",k);n.get("/api/health",async(e,a)=>{try{return await s.query("SELECT 1"),a.status(200).json({status:"online",message:"API e PostgreSQL funcionando!",database:"conectado"})}catch(o){return console.error("Erro na verifica\xE7\xE3o:",o.message),a.status(503).json({status:"erro",message:"API dispon\xEDvel, mas sem conex\xE3o com o banco.",database:"desconectado"})}});async function Ao(){(!process.env.DATABASE_URL||!process.env.SESSION_SECRET)&&(console.error("Configure DATABASE_URL e SESSION_SECRET no arquivo .env."),process.exit(1)),await y()||(console.error("Servidor n\xE3o iniciado: verifique o PostgreSQL."),process.exit(1)),n.listen(N,()=>{console.log(`Servidor rodando em http://localhost:${N}`),console.log(`Verifica\xE7\xE3o: http://localhost:${N}/api/health`)})}Ao();
