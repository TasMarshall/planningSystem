package simple;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
public class SimpleController {

    @RequestMapping(value="/lifePlan/xml", method=RequestMethod.GET, produces=MediaType.APPLICATION_XML_VALUE)
    public String sayHi() throws IOException {
        String xmlOutput = "";

        try {
            xmlOutput = new String(Files.readAllBytes(Paths.get("C:\\Users\\tjtma\\swePro\\src\\main\\java\\simple\\myPlan.model")));
        } catch (IOException e) { e.printStackTrace(); }


        XMLFormatter.format(xmlOutput);

        //Returns XML
        return (xmlOutput);
    }

}
