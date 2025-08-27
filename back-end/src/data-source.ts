// Single-export shim for TypeORM CLI: import the DataSource instance defined
// at the project root and re-export it as the default export.
import { AppDataSource } from '../data-source';
export default AppDataSource;
