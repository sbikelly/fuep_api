# Deployment Troubleshooting Guide

This guide helps you resolve common database connection issues when deploying the FUEP Post-UTME Portal to cloud platforms like Render, Railway, or Docker Hub.

## Common Database Connection Issues

### 1. **Environment Variable Mismatch**

**Problem**: The API expects individual database variables but cloud platforms provide `DATABASE_URL`.

**Solution**: The updated `knex.ts` now handles both formats automatically.

**Check**:

```bash
# Render/Railway typically provide:
DATABASE_URL=postgres://user:password@host:port/database

# Your app can also use individual variables:
DB_HOST=host
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=database
```

### 2. **SSL Configuration Issues**

**Problem**: Cloud databases require SSL connections but local development doesn't.

**Solution**: SSL is automatically configured based on environment:

- Production + non-localhost host = SSL enabled
- Development + localhost = SSL disabled

### 3. **Connection Timeout**

**Problem**: Database isn't ready when the API starts.

**Solution**: Added connection retry logic with 30-second timeout and 2-second intervals.

### 4. **Database User Mismatch**

**Problem**: Different usernames between local and cloud databases.

**Solution**: Updated `render.yaml` to use correct database properties.

## Platform-Specific Solutions

### **Render.com**

#### Configuration Issues

```yaml
# render.yaml - Fixed configuration
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: fuep-postgres
      property: connectionString
  - key: DB_HOST
    fromDatabase:
      name: fuep-postgres
      property: host
  # ... other DB variables
```

#### Common Problems:

1. **Database not ready**: Wait 2-3 minutes after database creation
2. **Wrong database name**: Check `render.yaml` database configuration
3. **Missing environment variables**: Verify all required variables are set

#### Debug Commands:

```bash
# Check environment variables
echo $DATABASE_URL
echo $DB_HOST
echo $DB_USER

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

### **Railway**

#### Configuration:

```bash
# Set environment variables in Railway dashboard
DATABASE_URL=postgresql://postgres:password@host:port/railway
NODE_ENV=production
PORT=4000
```

#### Common Problems:

1. **Database URL format**: Railway uses `postgresql://` not `postgres://`
2. **Port binding**: Ensure PORT environment variable is set
3. **Database initialization**: Wait for database to be fully provisioned

### **Docker Hub**

#### Configuration:

```bash
# Run with environment variables
docker run -d -p 4000:4000 \
  -e DATABASE_URL=postgres://user:pass@host:port/db \
  -e NODE_ENV=production \
  sbikelly/fuep-api:latest
```

#### Common Problems:

1. **Network connectivity**: Ensure container can reach database
2. **Environment variables**: Pass all required variables
3. **Database host**: Use external database service

## Debugging Steps

### 1. **Check Environment Variables**

```bash
# In your deployment platform, check:
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $DATABASE_URL"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"
```

### 2. **Test Database Connection**

```bash
# Test with psql
psql $DATABASE_URL -c "SELECT version();"

# Test with Node.js
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  console.log('Database connected successfully');
  client.end();
}).catch(err => {
  console.error('Database connection failed:', err);
});
"
```

### 3. **Check Application Logs**

```bash
# Look for these log messages:
# ✅ Good:
"Database connection established successfully"
"Connection successful"

# ❌ Bad:
"Connection attempt X/5 failed"
"Database connection timeout"
"All connection attempts failed"
```

### 4. **Verify Database Schema**

```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Check if migrations ran
psql $DATABASE_URL -c "SELECT * FROM knex_migrations;"
```

## Environment-Specific Configurations

### **Development (Local)**

```bash
# .env file
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=fuep
DB_PASSWORD=fuep
DB_NAME=fuep_portal
```

### **Production (Cloud)**

```bash
# Environment variables
NODE_ENV=production
DATABASE_URL=postgres://user:password@host:port/database
# OR individual variables:
DB_HOST=external-host
DB_PORT=5432
DB_USER=production_user
DB_PASSWORD=secure_password
DB_NAME=production_db
```

## Connection Pool Configuration

The updated configuration includes optimized connection pooling:

```javascript
pool: {
  min: 0,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
},
acquireConnectionTimeout: 30000,
```

## Health Check Endpoints

### **API Health**

```bash
curl https://your-app.onrender.com/api/health
```

### **Database Health**

```bash
curl https://your-app.onrender.com/api/health/db
```

## Common Error Messages and Solutions

### **"Connection terminated unexpectedly"**

- **Cause**: Database server restarted or network issue
- **Solution**: Check database service status, verify connection string

### **"password authentication failed"**

- **Cause**: Wrong username/password
- **Solution**: Verify database credentials in environment variables

### **"database does not exist"**

- **Cause**: Database name mismatch
- **Solution**: Check `DB_NAME` or database name in `DATABASE_URL`

### **"connection timeout"**

- **Cause**: Database not accessible or slow response
- **Solution**: Check database service status, verify network connectivity

### **"SSL connection required"**

- **Cause**: Database requires SSL but connection doesn't use it
- **Solution**: Ensure `NODE_ENV=production` and non-localhost host

## Testing Database Connection

### **Manual Test**

```bash
# Test connection string
psql "postgres://user:password@host:port/database" -c "SELECT 1;"

# Test individual variables
psql -h host -p port -U user -d database -c "SELECT 1;"
```

### **Application Test**

```bash
# Start application and check logs
npm start
# Look for: "Database connection established successfully"
```

## Deployment Checklist

### **Before Deployment**

- [ ] Database service is running
- [ ] Environment variables are set correctly
- [ ] Database user has proper permissions
- [ ] Network connectivity is available
- [ ] SSL configuration is correct

### **After Deployment**

- [ ] Check application logs for connection success
- [ ] Test health endpoints
- [ ] Verify database queries work
- [ ] Monitor connection pool status

## Platform-Specific Tips

### **Render.com**

- Wait 2-3 minutes after database creation
- Check Render dashboard for database status
- Use Render's built-in database management tools

### **Railway**

- Ensure database service is running
- Check Railway logs for connection errors
- Verify environment variables in Railway dashboard

### **Docker Hub**

- Use external database service (not containerized)
- Ensure proper network configuration
- Pass all required environment variables

## Getting Help

If you're still experiencing issues:

1. **Check logs**: Look for specific error messages
2. **Test connection**: Use `psql` or similar tools
3. **Verify config**: Double-check environment variables
4. **Contact support**: Platform-specific support channels

## Quick Fixes

### **Reset Database Connection**

```bash
# Restart application
# Clear connection pool
# Check environment variables
```

### **Update Environment Variables**

```bash
# Set correct DATABASE_URL
export DATABASE_URL="postgres://user:password@host:port/database"

# Or set individual variables
export DB_HOST="host"
export DB_PORT="5432"
export DB_USER="user"
export DB_PASSWORD="password"
export DB_NAME="database"
```

### **Test Locally with Production Config**

```bash
# Use production database URL locally
DATABASE_URL="postgres://user:password@host:port/database" npm start
```

---

**Remember**: The updated code now handles most connection issues automatically. If problems persist, check the specific error messages and follow the debugging steps above.
