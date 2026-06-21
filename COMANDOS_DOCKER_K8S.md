# Docker Hub y Kubernetes - SecOps CyberDefenders

> Los comandos usan la cuenta de ejemplo `retlaw2002`. Si la cuenta real es otra, reemplazarla también en los YAML de `k8s`.

## 1. Ubicarse en la raíz del repositorio

```powershell
cd ruta\SecOps_CyberDefenders_Vanguardia
```

## 2. Iniciar sesión en Docker Hub

```powershell
docker login
```

## 3. Construir las dos imágenes

El punto final es obligatorio porque indica el contexto de construcción.

```powershell
docker build -f backend/Dockerfile.k8s -t retlaw2002/secops-backend:1.0.0 ./backend
docker build -f frontend/Dockerfile.k8s -t retlaw2002/secops-frontend:1.0.0 ./frontend
```

## 4. Probar las imágenes creadas

```powershell
docker images | findstr secops
```

## 5. Subir las imágenes a Docker Hub

```powershell
docker push retlaw2002/secops-backend:1.0.0
docker push retlaw2002/secops-frontend:1.0.0
```

PostgreSQL no necesita una imagen propia; Kubernetes descargará la imagen oficial `postgres:15-alpine`.

## 6. Desplegar todos los archivos Kubernetes

```powershell
kubectl apply -k k8s
```

También se pueden aplicar uno por uno:

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-config-and-secret.yaml
kubectl apply -f k8s/02-database.yaml
kubectl apply -f k8s/03-backend.yaml
kubectl apply -f k8s/04-frontend.yaml
```

## 7. Verificar el despliegue

```powershell
kubectl get all -n secops
kubectl get pods -n secops -w
kubectl get pvc -n secops
```

Los tres pods deben llegar a `Running` y `READY 1/1`:

- `postgres-...`
- `backend-...`
- `frontend-...`

## 8. Abrir la aplicación

Con Kubernetes de Docker Desktop:

```text
http://localhost:30080
```

Con Minikube:

```powershell
minikube service frontend -n secops --url
```

## 9. Diagnóstico

```powershell
kubectl logs deployment/postgres -n secops
kubectl logs deployment/backend -n secops
kubectl logs deployment/frontend -n secops
kubectl describe pod NOMBRE_DEL_POD -n secops
```

Probar la comunicación interna entre frontend y backend:

```powershell
kubectl exec deployment/frontend -n secops -- wget -qO- http://backend:3000/api/health
```

## 10. Actualizar después de cambiar código

Usar una etiqueta nueva para evitar caché, por ejemplo `1.0.1`:

```powershell
docker build -f backend/Dockerfile.k8s -t retlaw2002/secops-backend:1.0.1 ./backend
docker build -f frontend/Dockerfile.k8s -t retlaw2002/secops-frontend:1.0.1 ./frontend

docker push retlaw2002/secops-backend:1.0.1
docker push retlaw2002/secops-frontend:1.0.1
```

Después cambiar `1.0.0` por `1.0.1` en:

- `k8s/03-backend.yaml`
- `k8s/04-frontend.yaml`

Y aplicar de nuevo:

```powershell
kubectl apply -k k8s
kubectl rollout status deployment/backend -n secops
kubectl rollout status deployment/frontend -n secops
```


