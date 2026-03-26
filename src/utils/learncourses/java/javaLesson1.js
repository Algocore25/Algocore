export const javaLesson1 = {
  id: 1,
  title: 'Basics & Setup',
  description: 'Introduction to Java and environment setup',
  difficulty: 'Beginner',
  duration: '8 mins',
  content: `
## What is Java?

Java is a high-level, object-oriented programming language known for its "write once, run anywhere" (WORA) philosophy. It's one of the most popular programming languages used for building web applications, mobile apps, and enterprise software.

### Key Features of Java:
- **Platform Independent**: Java code runs on any platform that has JVM installed (Java Virtual Machine).
- **Object-Oriented**: Everything in Java is an object (except primitive types).
- **Simple and Familiar**: Java syntax is largely based on C and C++.
- **Robust**: Strong memory management, automatic garbage collection, and robust exception handling.
- **Secure**: Features like the Bytecode Verifier, Security Manager, and No Explicit Pointers make Java highly secure.
- **Multithreaded**: Supports concurrent programming out of the box.

### Java Architecture (JVM, JRE, JDK):
Getting an understanding of Java requires knowing these three parts:
1. **JDK (Java Development Kit)**: Contains JRE + Development Tools (like \`javac\` compiler). You need this to write and run Java programs.
2. **JRE (Java Runtime Environment)**: Contains JVM + Standard Class Libraries. You need this just to *run* Java programs.
3. **JVM (Java Virtual Machine)**: The abstract machine that executes Java Bytecode.

### Setting Up Java:
1. **Download JDK**: Visit oracle.com or use OpenJDK to download the Java Development Kit.
2. **Install JDK**: Follow platform-specific installation instructions.
3. **Set Environment Variables**: Set \`JAVA_HOME\` to the JDK directory and add \`%JAVA_HOME%\\bin\` to your OS \`PATH\` variable.
4. **Verify Installation**: Open a command prompt/terminal and run \`java -version\` and \`javac -version\`.

### Your First Java Program:
\`\`\`java
public class HelloWorld {
    // The main method is the entry point of your program
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

### Compilation and Execution:
- To compile: \`javac HelloWorld.java\` (This creates \`HelloWorld.class\` containing bytecode).
- To run: \`java HelloWorld\` (JVM executes the bytecode).

**Try it yourself in the compiler below!**

<COMPILER>
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to Java!");
    }
}
</COMPILER>
`
};