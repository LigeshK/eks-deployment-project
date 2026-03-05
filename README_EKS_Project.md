**Current Project Status: Fully Operational in AWS EKS**
![alt text](image-11.png)
![alt text](image-12.png)

When created EKS - VPC with stack, it created as internal. So postman timedout.
So, changed the config in users.yaml to make ELB public facing.

annotations:
service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"

The API stated working in Postman.
![alt text](image-13.png)

![alt text](image-14.png)

So same configuration with Minikube worked with EKS, so addition AWS settings was added. Other than Load balancer made public.

Database - Mongo DB atlas - data inserted
![alt text](image-15.png)
