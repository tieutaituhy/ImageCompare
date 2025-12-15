# Chỉ cần Runtime để chạy (không cần SDK để build nữa)
# Lưu ý: Hãy đảm bảo version Runtime khớp với version bạn đã build (VD: 8.0, 9.0 hoặc 10.0 như bạn đang dùng)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app

# Copy toàn bộ file DLL và Config từ thư mục hiện tại (bên ngoài) vào thư mục /app trong container
COPY . .

# Mở port 8080
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Chạy file DLL chính
ENTRYPOINT ["dotnet", "ImageCompare.dll"]