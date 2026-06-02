# Build stage
FROM maven:3.9.7-eclipse-temurin-17 AS build
WORKDIR /app
# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src
# Build the application, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
# Expose the port (Render sets the PORT environment variable)
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
