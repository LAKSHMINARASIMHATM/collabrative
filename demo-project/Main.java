/**
 * CodeSync IDE Demo Project - Java Example
 * A simple Java application demonstrating basic OOP concepts
 */

import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("=".repeat(50));
        System.out.println("CodeSync IDE - Java Demo");
        System.out.println("=".repeat(50));

        // Create a demo project
        Project ideProject = new Project("CodeSync IDE", "Development Tool");
        
        // Add features
        ideProject.addFeature("Monaco Editor Integration");
        ideProject.addFeature("Real-time Collaboration");
        ideProject.addFeature("Multi-language Support");
        ideProject.addFeature("Advanced Debugging");
        ideProject.addFeature("Git Integration");

        // Display project info
        ideProject.displayInfo();

        // Demonstrate calculations
        Calculator calc = new Calculator();
        System.out.println("\n--- Calculator Demo ---");
        System.out.println("5 + 3 = " + calc.add(5, 3));
        System.out.println("10 - 4 = " + calc.subtract(10, 4));
        System.out.println("6 * 7 = " + calc.multiply(6, 7));
        System.out.println("20 / 4 = " + calc.divide(20, 4));

        // Array and loop example
        System.out.println("\n--- Supported Languages ---");
        String[] languages = {"JavaScript", "Python", "Java", "C++", "Go", "Rust", "PHP"};
        for (int i = 0; i < languages.length; i++) {
            System.out.println((i + 1) + ". " + languages[i]);
        }
    }
}

/**
 * Project class representing a software project
 */
class Project {
    private String name;
    private String type;
    private List<String> features;

    public Project(String name, String type) {
        this.name = name;
        this.type = type;
        this.features = new ArrayList<>();
    }

    public void addFeature(String feature) {
        features.add(feature);
    }

    public void displayInfo() {
        System.out.println("\n--- Project Information ---");
        System.out.println("Name: " + name);
        System.out.println("Type: " + type);
        System.out.println("Features: " + features.size());
        
        System.out.println("\nFeature List:");
        for (int i = 0; i < features.size(); i++) {
            System.out.println("  " + (i + 1) + ". " + features.get(i));
        }
    }

    // Getters
    public String getName() { return name; }
    public String getType() { return type; }
    public List<String> getFeatures() { return features; }
}

/**
 * Calculator class with basic arithmetic operations
 */
class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int subtract(int a, int b) {
        return a - b;
    }

    public int multiply(int a, int b) {
        return a * b;
    }

    public double divide(double a, double b) {
        if (b == 0) {
            throw new ArithmeticException("Cannot divide by zero!");
        }
        return a / b;
    }

    public double power(double base, int exponent) {
        return Math.pow(base, exponent);
    }

    public int factorial(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("Factorial not defined for negative numbers");
        }
        if (n == 0 || n == 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }
}
