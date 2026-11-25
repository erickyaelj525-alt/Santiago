-- =====================================================================
-- Apiario Digital - Esquema de base de datos (MySQL / MariaDB)
-- Proyecto Web FullStack - Ciberecus
-- Motor: InnoDB, charset utf8mb4
-- =====================================================================

DROP DATABASE IF EXISTS apiario_digital;
CREATE DATABASE apiario_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apiario_digital;

-- ---------------------------------------------------------------------
-- Usuarios. Dos roles:
--   * 'dueno'      -> propietario de la operación apícola (dueño de los datos)
--   * 'trabajador' -> empleado creado por un dueño (dueno_id apunta a su dueño)
-- Los trabajadores comparten los apiarios de su dueño (ver backend/src/utils/scope.js).
-- La contraseña se guarda con hash bcrypt (nunca en texto plano).
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           ENUM('dueno','trabajador') NOT NULL DEFAULT 'dueno',
  dueno_id      INT           NULL,  -- dueño al que pertenece un trabajador (NULL si es dueño)
  email_verificado    TINYINT(1) NOT NULL DEFAULT 1,  -- Campo legacy, ya no bloquea el acceso
  codigo_verificacion VARCHAR(6) NULL,                -- Campo legacy, ya no se usa
  codigo_expira       DATETIME   NULL,                -- Campo legacy, ya no se usa
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_dueno FOREIGN KEY (dueno_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuarios_dueno (dueno_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Apiarios: ubicaciones físicas donde vive un conjunto de colmenas.
-- ---------------------------------------------------------------------
CREATE TABLE apiarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT            NOT NULL,
  nombre      VARCHAR(120)   NOT NULL,
  descripcion VARCHAR(255)   NULL,
  lat         DECIMAL(9,6)   NULL,
  lng         DECIMAL(9,6)   NULL,
  municipio   VARCHAR(120)   NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_apiario_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_apiarios_usuario (usuario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Colmenas: cada unidad productiva dentro de un apiario.
-- ---------------------------------------------------------------------
CREATE TABLE colmenas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  apiario_id        INT          NOT NULL,
  codigo            VARCHAR(40)  NOT NULL,
  tipo              ENUM('langstroth','top_bar','warre','otro') NOT NULL DEFAULT 'langstroth',
  fecha_instalacion DATE         NULL,
  estado            ENUM('activa','débil','reina_nueva','vacía','enferma','muerta') NOT NULL DEFAULT 'activa',
  reina_marcada     TINYINT(1)   NOT NULL DEFAULT 0,
  notas             VARCHAR(255) NULL,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_colmena_apiario FOREIGN KEY (apiario_id)
    REFERENCES apiarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_colmena_apiario (apiario_id, codigo),
  INDEX idx_colmenas_apiario (apiario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Inspecciones: revisión periódica del estado de una colmena.
-- ---------------------------------------------------------------------
CREATE TABLE inspecciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  colmena_id      INT           NOT NULL,
  fecha           DATE          NOT NULL,
  poblacion       TINYINT       NOT NULL DEFAULT 3,   -- 1..5 (fuerza de la colonia)
  temperamento    TINYINT       NOT NULL DEFAULT 3,   -- 1..5 (1 = muy dócil)
  presencia_reina TINYINT(1)    NOT NULL DEFAULT 0,
  celdas_reales   TINYINT(1)    NOT NULL DEFAULT 0,   -- riesgo de enjambrazón
  nivel_varroa    TINYINT       NOT NULL DEFAULT 0,   -- 0..5 (ácaro Varroa)
  alimento_miel   TINYINT(1)    NOT NULL DEFAULT 1,
  alimento_polen  TINYINT(1)    NOT NULL DEFAULT 1,
  clima_temp      DECIMAL(4,1)  NULL,                 -- temperatura registrada
  notas           VARCHAR(500)  NULL,
  creado_por      INT           NULL,                 -- autor del registro (dueño o trabajador)
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspeccion_colmena FOREIGN KEY (colmena_id)
    REFERENCES colmenas(id) ON DELETE CASCADE,
  CONSTRAINT fk_inspeccion_autor FOREIGN KEY (creado_por)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_inspecciones_colmena (colmena_id),
  INDEX idx_inspecciones_autor (creado_por)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Cosechas: extracción de miel de una colmena.
-- ---------------------------------------------------------------------
CREATE TABLE cosechas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  colmena_id  INT           NOT NULL,
  fecha       DATE          NOT NULL,
  kg_miel     DECIMAL(6,2)  NOT NULL,
  tipo_miel   VARCHAR(80)   NULL,
  humedad_pct DECIMAL(4,1)  NULL,
  notas       VARCHAR(255)  NULL,
  creado_por  INT           NULL,                     -- autor del registro
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cosecha_colmena FOREIGN KEY (colmena_id)
    REFERENCES colmenas(id) ON DELETE CASCADE,
  CONSTRAINT fk_cosecha_autor FOREIGN KEY (creado_por)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_cosechas_colmena (colmena_id),
  INDEX idx_cosechas_autor (creado_por)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tratamientos: sanitarios aplicados a una colmena (Varroa, etc.).
-- ---------------------------------------------------------------------
CREATE TABLE tratamientos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  colmena_id   INT          NOT NULL,
  tipo         ENUM('varroa','nosema','loque','otro') NOT NULL DEFAULT 'varroa',
  producto     VARCHAR(120) NOT NULL,
  dosis        VARCHAR(80)  NULL,
  fecha_inicio DATE         NOT NULL,
  fecha_fin    DATE         NULL,
  notas        VARCHAR(255) NULL,
  creado_por   INT          NULL,                     -- autor del registro
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tratamiento_colmena FOREIGN KEY (colmena_id)
    REFERENCES colmenas(id) ON DELETE CASCADE,
  CONSTRAINT fk_tratamiento_autor FOREIGN KEY (creado_por)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_tratamientos_colmena (colmena_id),
  INDEX idx_tratamientos_autor (creado_por)
) ENGINE=InnoDB;
