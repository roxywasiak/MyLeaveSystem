import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entity/User";
import { Role } from "./entity/Role";
import { LeaveType } from "./entity/LeaveType";
import { LeaveRequest } from "./entity/LeaveRequest";
import { UserManagement } from "./entity/UserManagement";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
    entities: [Role, User, LeaveType, LeaveRequest,UserManagement]
});