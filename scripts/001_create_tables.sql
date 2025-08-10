-- Create AUTOBUSES table
CREATE TABLE AUTOBUSES (
    id_autobus INT PRIMARY KEY IDENTITY(1,1),
    modelo VARCHAR(255) NOT NULL,
    capacidad INT NOT NULL,
    placa VARCHAR(50) UNIQUE NOT NULL
);

-- Create ESTACIONES table
CREATE TABLE ESTACIONES (
    id_estacion INT PRIMARY KEY IDENTITY(1,1),
    nombre_estacion VARCHAR(255) UNIQUE NOT NULL,
    ciudad VARCHAR(255) NOT NULL,
    direccion VARCHAR(255)
);

-- Create RUTAS table
CREATE TABLE RUTAS (
    id_ruta INT PRIMARY KEY IDENTITY(1,1),
    origen_id INT NOT NULL,
    destino_id INT NOT NULL,
    distancia_km DECIMAL(10, 2) NOT NULL,
    duracion_estimada_min INT NOT NULL,
    FOREIGN KEY (origen_id) REFERENCES ESTACIONES(id_estacion),
    FOREIGN KEY (destino_id) REFERENCES ESTACIONES(id_estacion)
);

-- Create VIAJES table
CREATE TABLE VIAJES (
    id_viaje INT PRIMARY KEY IDENTITY(1,1),
    ruta_id INT NOT NULL,
    autobus_id INT NOT NULL,
    fecha_salida DATE NOT NULL,
    hora_salida TIME NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    asientos_disponibles INT NOT NULL,
    FOREIGN KEY (ruta_id) REFERENCES RUTAS(id_ruta),
    FOREIGN KEY (autobus_id) REFERENCES AUTOBUSES(id_autobus)
);

-- Create ASIENTOS table (to manage individual seats per bus)
CREATE TABLE ASIENTOS (
    id_asiento INT PRIMARY KEY IDENTITY(1,1),
    autobus_id INT NOT NULL,
    numero_asiento INT NOT NULL,
    disponible BIT NOT NULL DEFAULT 1, -- 1 for available, 0 for occupied
    FOREIGN KEY (autobus_id) REFERENCES AUTOBUSES(id_autobus),
    UNIQUE (autobus_id, numero_asiento) -- Ensure unique seat numbers per bus
);

-- Create USUARIOS table
CREATE TABLE USUARIOS (
    id_usuario INT PRIMARY KEY IDENTITY(1,1),
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50)
);

-- Create BOLETOS table
CREATE TABLE BOLETOS (
    id_boleto INT PRIMARY KEY IDENTITY(1,1),
    id_viaje INT NOT NULL,
    id_usuario INT NOT NULL,
    asiento_numero INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    fecha_compra DATETIME NOT NULL DEFAULT GETDATE(),
    estado VARCHAR(50) NOT NULL, -- e.g., 'Reservado', 'Pagado', 'Cancelado'
    FOREIGN KEY (id_viaje) REFERENCES VIAJES(id_viaje),
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario),
    UNIQUE (id_viaje, asiento_numero) -- A seat can only be booked once per trip
);

-- Create PAGOS table
CREATE TABLE PAGOS (
    id_pago INT PRIMARY KEY IDENTITY(1,1),
    boleto_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATETIME NOT NULL DEFAULT GETDATE(),
    metodo_pago VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL, -- e.g., 'Pendiente', 'Completado', 'Fallido'
    FOREIGN KEY (boleto_id) REFERENCES BOLETOS(id_boleto)
);

-- Triggers to manage asiento_disponible in VIAJES and ASIENTOS table
-- Trigger for ticket creation
CREATE TRIGGER trg_AfterInsertBoleto
ON BOLETOS
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Update asientos_disponibles in VIAJES
    UPDATE V
    SET V.asientos_disponibles = V.asientos_disponibles - 1
    FROM VIAJES V
    INNER JOIN INSERTED I ON V.id_viaje = I.id_viaje;

    -- Mark seat as unavailable in ASIENTOS
    UPDATE A
    SET A.disponible = 0
    FROM ASIENTOS A
    INNER JOIN INSERTED I ON A.autobus_id = (SELECT autobus_id FROM VIAJES WHERE id_viaje = I.id_viaje)
                         AND A.numero_asiento = I.asiento_numero;
END;
GO

-- Trigger for ticket deletion
CREATE TRIGGER trg_AfterDeleteBoleto
ON BOLETOS
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Update asientos_disponibles in VIAJES
    UPDATE V
    SET V.asientos_disponibles = V.asientos_disponibles + 1
    FROM VIAJES V
    INNER JOIN DELETED D ON V.id_viaje = D.id_viaje;

    -- Mark seat as available in ASIENTOS
    UPDATE A
    SET A.disponible = 1
    FROM ASIENTOS A
    INNER JOIN DELETED D ON A.autobus_id = (SELECT autobus_id FROM VIAJES WHERE id_viaje = D.id_viaje)
                         AND A.numero_asiento = D.asiento_numero;
END;
GO

-- Trigger for ticket update (if seat or trip changes, or state changes to cancelled)
CREATE TRIGGER trg_AfterUpdateBoleto
ON BOLETOS
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- If trip_id or asiento_numero changed, revert old seat and occupy new one
    IF UPDATE(id_viaje) OR UPDATE(asiento_numero)
    BEGIN
        -- Revert old seat availability
        UPDATE A
        SET A.disponible = 1
        FROM ASIENTOS A
        INNER JOIN DELETED D ON A.autobus_id = (SELECT autobus_id FROM VIAJES WHERE id_viaje = D.id_viaje)
                             AND A.numero_asiento = D.asiento_numero;

        -- Occupy new seat availability
        UPDATE A
        SET A.disponible = 0
        FROM ASIENTOS A
        INNER JOIN INSERTED I ON A.autobus_id = (SELECT autobus_id FROM VIAJES WHERE id_viaje = I.id_viaje)
                              AND A.numero_asiento = I.asiento_numero;

        -- Adjust asientos_disponibles for old trip
        UPDATE V
        SET V.asientos_disponibles = V.asientos_disponibles + 1
        FROM VIAJES V
        INNER JOIN DELETED D ON V.id_viaje = D.id_viaje;

        -- Adjust asientos_disponibles for new trip
        UPDATE V
        SET V.asientos_disponibles = V.asientos_disponibles - 1
        FROM VIAJES V
        INNER JOIN INSERTED I ON V.id_viaje = I.id_viaje;
    END
    ELSE IF UPDATE(estado)
    BEGIN
        -- If state changed from 'Pagado'/'Reservado' to 'Cancelado'
        IF EXISTS (SELECT 1 FROM DELETED D JOIN INSERTED I ON D.id_boleto = I.id_boleto WHERE D.estado IN ('Reservado', 'Pagado') AND I.estado = 'Cancelado')
        BEGIN
            -- Increase available seats for the trip
            UPDATE V
            SET V.asientos_disponibles = V.asientos_disponibles + 1
            FROM VIAJES V
            INNER JOIN INSERTED I ON V.id_viaje = I.id_viaje;

            -- Mark seat as available in ASIENTOS
            UPDATE A
            SET A.disponible = 1
            FROM ASIENTOS A
            INNER JOIN INSERTED I ON A.autobus_id = (SELECT autobus_id FROM VIAJES WHERE id_viaje = I.id_viaje)
                                 AND A.numero_asiento = I.asiento_numero;
        END
        -- If state changed from 'Cancelado' to 'Reservado'/'Pagado'
        ELSE IF EXISTS (SELECT 1 FROM DELETED D JOIN INSERTED I ON D.id_boleto = I.id_boleto WHERE D.estado = 'Cancelado' AND I.estado IN ('Reservado', 'Pagado'))
        BEGIN
            -- Decrease available seats for the trip
            UPDATE V
            SET V.asientos_disponibles = V.asientos_disponibles - 1
            FROM VIAJES V
            INNER JOIN INSERTED I ON V.id_viaje = I.id_viaje;

            -- Mark seat as unavailable in ASIENTOS
            UPDATE A
            SET A.disponible = 0
            FROM ASIENTOS A
            INNER JOIN INSERTED I ON A.autobus_id = (SELECT autobus_id FROM VIAJES WHERE id_viaje = I.id_viaje)
                                 AND A.numero_asiento = I.asiento_numero;
        END
    END;
END;
GO
