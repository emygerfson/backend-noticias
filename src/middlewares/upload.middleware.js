
import multer from "multer";

// Tipos de imagem permitidos
const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

// Validação do tipo de arquivo
function validarArquivo(req, file, callback) {
    if (!tiposPermitidos.includes(file.mimetype)) {
        return callback(
            new Error("Formato inválido. Envie JPG, PNG ou WEBP.")
        );
    }

    callback(null, true);
}

// Configuração principal do Multer (memoryStorage para salvar no PostgreSQL)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: validarArquivo,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

export const uploadImagemNoticia = upload.single("imagem");
