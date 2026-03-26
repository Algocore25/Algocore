export const javaLesson10 = {
  id: 10,
  title: 'File I/O & Streams',
  description: 'Reading from and writing to local files.',
  content: `
## File I/O in Java

Java uses Streams to handle I/O operations smoothly. A stream is a logical sequence of data.

### Writing to a File
\`\`\`java
import java.io.FileWriter;
import java.io.IOException;

public class WriteDemo {
    public static void main(String[] args) {
        // try-with-resources statement automatically closes resources!
        try (FileWriter writer = new FileWriter("output.txt")) {
            writer.write("Hello File System\\n");
            writer.write("Java handles this so easily!");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
\`\`\`

### Reading from a File
\`\`\`java
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

public class ReadDemo {
    public static void main(String[] args) {
        try {
            File file = new File("output.txt");
            Scanner reader = new Scanner(file);
            
            while (reader.hasNextLine()) {
                String data = reader.nextLine();
                System.out.println(data);
            }
            reader.close();
            
        } catch (FileNotFoundException e) {
            System.out.println("File could not be located.");
        }
    }
}
\`\`\`

### Java NIO (New I/O)
NIO introduced a simpler way to manage small files using the \`Files\` and \`Paths\` classes.
\`\`\`java
import java.nio.file.Files;
import java.nio.file.Paths;

// Read all lines at once into memory
List<String> lines = Files.readAllLines(Paths.get("output.txt"));
\`\`\`
`
};