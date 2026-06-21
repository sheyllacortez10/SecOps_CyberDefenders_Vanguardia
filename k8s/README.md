# Despliegue Kubernetes - SecOps CyberDefenders

## Componentes

- `00-namespace.yaml`: namespace `secops`.
- `01-config-and-secret.yaml`: configuración y credenciales de demostración.
- `02-database.yaml`: PostgreSQL, script de inicialización, PVC y Service.
- `03-backend.yaml`: API Node/Express y Service interno `backend`.
- `04-frontend.yaml`: React servido por Nginx y Service NodePort.
- `kustomization.yaml`: permite aplicar todos los YAML juntos.

## Antes de desplegar

1. Construir y publicar las imágenes `retlaw2002/secops-backend:1.0.0` y `retlaw2002/secops-frontend:1.0.0`.
2. Cambiar las credenciales de demostración en `01-config-and-secret.yaml`.
3. Si se usa otra cuenta de Docker Hub, cambiar `retlaw2002` en `03-backend.yaml` y `04-frontend.yaml`.

## Despliegue

```bash
kubectl apply -k k8s
kubectl get all -n secops
kubectl get pvc -n secops
```

Acceso local habitual:

- Docker Desktop Kubernetes: `http://localhost:30080`
- Minikube: ejecutar `minikube service frontend -n secops --url`

## Eliminación

```bash
kubectl delete -k k8s
```

El PVC puede permanecer dependiendo del clúster. Para borrarlo manualmente:

```bash
kubectl delete pvc postgres-data -n secops
```
